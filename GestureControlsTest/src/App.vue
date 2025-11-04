<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import p5 from 'p5'

// Import our new composables and modules
import { useGestureDetection } from './composables/useGestureDetection'
import { useWebSocket } from './composables/useWebSocket'
import { useDevicePermissions } from './composables/useDevicePermissions'
import { createDotSketch } from './modules/dotSketch'

const canvasContainer = ref<HTMLElement>()
let p5Instance: p5 | null = null
let sketchModule: any = null

// Initialize composables
const gestureDetection = useGestureDetection()
const webSocket = useWebSocket()
const devicePermissions = useDevicePermissions()

// Sketch configuration
const sketchConfig = {
  dotSize: 30,
  easing: 0.08,
  gyroSensitivity: 8
}

// Setup gesture callback to send data via WebSocket
gestureDetection.setGestureCallback((gestureData) => {
  webSocket.sendActionData(gestureData)
})

// Calibration function that resets both gesture detection and dot position
const calibrateDevice = () => {
  gestureDetection.calibrateDevice()
  
  // Reset dot to center of canvas
  if (p5Instance && sketchModule) {
    sketchModule.resetDotPosition(p5Instance)
  }
  
  console.log('🎯 Device calibrated - dot reset to center')
}

// Test function for debugging
const testAction = () => {
  gestureDetection.currentAction.value = 'Test Jump'
  gestureDetection.actionIntensity.value = 75
  webSocket.sendActionData({ action: 'Test Jump', intensity: 75, timestamp: Date.now() })
  console.log('🧪 Test action triggered')
  
  setTimeout(() => {
    gestureDetection.currentAction.value = ''
    gestureDetection.actionIntensity.value = 0
  }, 2000)
}

// Request permissions and setup sensors
const requestMotionPermission = async () => {
  const granted = await devicePermissions.requestAndSetupSensors(
    gestureDetection.handleDeviceMotion,
    gestureDetection.handleDeviceOrientation
  )
  return granted
}

onMounted(async () => {
  if (canvasContainer.value) {
    // Create the p5 sketch with all the required functions
    sketchModule = createDotSketch(
      canvasContainer.value,
      () => gestureDetection.getCalibratedPosition(
        canvasContainer.value?.clientWidth ? canvasContainer.value.clientWidth / 2 : 400,
        canvasContainer.value?.clientHeight ? Math.min(canvasContainer.value.clientWidth * 0.75, 600) / 2 : 300,
        sketchConfig.gyroSensitivity
      ),
      gestureDetection.getJumpState,
      () => gestureDetection.currentAction.value,
      () => gestureDetection.actionIntensity.value,
      () => gestureDetection.sensorData.value,
      () => devicePermissions.permissionStatus.value,
      gestureDetection.getIsCalibrated,
      sketchConfig
    )
    
    p5Instance = new p5(sketchModule.sketch, canvasContainer.value)
  }
  
  // Initialize device permissions
  await devicePermissions.initializePermissions(
    gestureDetection.handleDeviceMotion,
    gestureDetection.handleDeviceOrientation
  )
})

onUnmounted(() => {
  if (p5Instance) {
    p5Instance.remove()
  }
  
  // Clean up event listeners
  devicePermissions.removeMotionListeners(
    gestureDetection.handleDeviceMotion,
    gestureDetection.handleDeviceOrientation
  )
  
  // Clean up WebSocket
  webSocket.cleanup()
})
</script>

<template>
  <div class="app-container">
    <h1>Gesture-Controlled Dot</h1>
    
    <!-- Current Action Display -->
    <div v-if="gestureDetection.currentAction.value" class="action-display">
      <h2>{{ gestureDetection.currentAction.value }}</h2>
      <div class="intensity-bar">
        <div class="intensity-fill" :style="{ width: gestureDetection.actionIntensity.value + '%' }"></div>
      </div>
      <p>Intensity: {{ gestureDetection.actionIntensity.value }}%</p>
    </div>
    
    <!-- WebSocket Controls -->
    <div class="websocket-controls">
      <div class="ws-status">
        <span :class="['status-indicator', webSocket.wsConnected.value ? 'connected' : 'disconnected']"></span>
        WebSocket: {{ webSocket.wsConnected.value ? 'Connected' : 'Disconnected' }}
      </div>
      
      <div class="ws-controls">
        <input 
          v-model="webSocket.wsUrl.value" 
          placeholder="ws://localhost:8080" 
          class="ws-input"
          :disabled="webSocket.wsConnected.value"
        />
        <button 
          v-if="!webSocket.wsConnected.value" 
          @click="webSocket.connectWebSocket"
          class="control-btn ws-btn"
        >
          🔗 Connect
        </button>
        <button 
          v-else 
          @click="webSocket.disconnectWebSocket"
          class="control-btn ws-btn disconnect"
        >
          🔌 Disconnect
        </button>
      </div>
      
      <div v-if="webSocket.wsError.value" class="ws-error">
        {{ webSocket.wsError.value }}
      </div>
    </div>
    
    <div class="controls" v-if="devicePermissions.supportsMotion.value">
      <button
        v-if="devicePermissions.permissionStatus.value === 'unknown'"
        @click="requestMotionPermission"
        class="control-btn enable-btn"
      >
        🔓 Enable Motion & Orientation
      </button>
      
      <button
        v-if="devicePermissions.permissionStatus.value === 'granted'"
        @click="calibrateDevice"
        class="control-btn calibrate-btn"
      >
        🎯 Calibrate Position
      </button>
      
      <button
        v-if="devicePermissions.permissionStatus.value === 'granted'"
        @click="testAction"
        class="control-btn test-btn"
      >
        🧪 Test Action
      </button>
      
      <div v-if="devicePermissions.permissionStatus.value === 'denied'" class="error-message">
        ❌ Motion sensor access denied or not available.
        <br><br>
        <strong>For iOS Safari:</strong><br>
        • Make sure you're using Safari (not Chrome/Firefox)<br>
        • The site must be served over HTTPS<br>
        • Try refreshing and tapping "Allow" when prompted<br>
        <br>
        <strong>Alternative:</strong> Try opening Safari settings while on this page:<br>
        Safari → Website Settings → Motion & Orientation Access → Allow
        <br><br>
        <button @click="requestMotionPermission" class="control-btn enable-btn small">
          🔄 Try Again
        </button>
      </div>
    </div>
    
    <div v-if="!devicePermissions.supportsMotion.value" class="error-message">
      Motion sensors not supported on this device.
    </div>
    
    <div ref="canvasContainer" class="canvas-container"></div>
    
    <div class="instructions">
      <p v-if="devicePermissions.permissionStatus.value === 'granted'">📱 <strong>Tilt your device</strong> to control the dot!</p>
      <p v-else-if="devicePermissions.permissionStatus.value === 'unknown'">
        🍎 <strong>iOS Users:</strong> Tap the button above to see permission popup<br>
        🤖 <strong>Android Users:</strong> Motion sensors will be enabled automatically
      </p>
      <p v-else-if="!devicePermissions.supportsMotion.value">🖱️ <strong>Use a mobile device</strong> for gyroscope controls</p>
      
      <!-- Debug Info -->
      <div class="debug-info">
        <h3>🔍 Debug Information:</h3>
        <p><strong>Permission Status:</strong> {{ devicePermissions.permissionStatus.value }}</p>
        <p><strong>Motion Support:</strong> {{ devicePermissions.supportsMotion.value }}</p>
        <p><strong>User Agent:</strong> {{ devicePermissions.debugInfo.value.userAgent }}</p>
        <p><strong>HTTPS:</strong> {{ devicePermissions.debugInfo.value.isHTTPS ? 'Yes' : 'No' }}</p>
        <p><strong>DeviceMotionEvent:</strong> {{ devicePermissions.debugInfo.value.hasDeviceMotion ? 'Available' : 'Not Available' }}</p>
        <p><strong>DeviceOrientationEvent:</strong> {{ devicePermissions.debugInfo.value.hasDeviceOrientation ? 'Available' : 'Not Available' }}</p>
        <p><strong>Motion Permission Function:</strong> {{ devicePermissions.debugInfo.value.hasMotionPermission ? 'Available' : 'Not Available' }}</p>
        <p><strong>Orientation Permission Function:</strong> {{ devicePermissions.debugInfo.value.hasOrientationPermission ? 'Available' : 'Not Available' }}</p>
      </div>
      
      <div v-if="devicePermissions.permissionStatus.value === 'granted'" class="sensor-info">
        <h3>🎮 Gesture Controls:</h3>
        <p>📱 <strong>Tilt</strong> to move the dot around</p>
        <p>💥 <strong>Quick Tilt Up</strong> to slam</p>
        <p>🦘 <strong>Quick Tilt Down</strong> to make the dot jump</p>
        <p>⬅️ <strong>Quick Tilt Left</strong> to dash left</p>
        <p>➡️ <strong>Quick Tilt Right</strong> to dash right</p>
        <p>✨ <strong>Intensity (0-100)</strong> based on tilt speed</p>
        <br>
        <p>🎯 Use "Calibrate" to reset the center position</p>
        <p>📊 Real-time sensor data shown on canvas</p>
      </div>
      
      <div v-if="devicePermissions.permissionStatus.value === 'unknown'" class="ios-info">
        <p><strong>What happens when you tap "Enable":</strong></p>
        <p>1️⃣ iOS should show a permission dialog</p>
        <p>2️⃣ Tap "Allow" to enable motion sensors</p>
        <p>3️⃣ Start tilting your device to control the dot!</p>
        <p><small>Check the debug info above if it's not working</small></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
  font-family: 'Arial', sans-serif;
}

h1 {
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  margin-bottom: 20px;
  font-size: 2.5em;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.control-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.enable-btn {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
}

.enable-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(238, 90, 36, 0.4);
}

.calibrate-btn {
  background: linear-gradient(45deg, #4ecdc4, #26d0ce);
  color: white;
}

.calibrate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);
}

.test-btn {
  background: linear-gradient(45deg, #9C27B0, #673AB7);
  color: white;
}

.test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(156, 39, 176, 0.4);
}

.control-btn.small {
  padding: 8px 16px;
  font-size: 14px;
  margin-top: 10px;
}

.action-display {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 100, 0.6);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  min-width: 250px;
  animation: pulse 1s ease-in-out;
}

.action-display h2 {
  margin: 0 0 15px 0;
  color: #FFD700;
  font-size: 28px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.intensity-bar {
  width: 100%;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.intensity-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #FFEB3B, #FF5722);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.action-display p {
  margin: 0;
  color: white;
  font-weight: bold;
  font-size: 16px;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.websocket-controls {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

.ws-status {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: white;
  font-weight: bold;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-indicator.connected {
  background: #4CAF50;
  box-shadow: 0 0 10px #4CAF50;
}

.status-indicator.disconnected {
  background: #F44336;
}

.ws-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.ws-input {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
}

.ws-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.ws-btn {
  background: linear-gradient(45deg, #2196F3, #21CBF3);
  color: white;
  padding: 8px 16px;
  font-size: 14px;
}

.ws-btn.disconnect {
  background: linear-gradient(45deg, #F44336, #FF5722);
}

.ws-error {
  color: #FF5722;
  font-size: 12px;
  margin-top: 5px;
  padding: 5px;
  background: rgba(255, 87, 34, 0.1);
  border-radius: 3px;
}

.error-message {
  background: rgba(255, 107, 107, 0.2);
  border: 2px solid rgba(255, 107, 107, 0.5);
  color: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: center;
  max-width: 400px;
}

.canvas-container {
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.canvas-container canvas {
  display: block;
  width: 100% !important;
  height: auto !important;
}

.instructions {
  margin-top: 20px;
  text-align: center;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  max-width: 600px;
}

.instructions p {
  margin: 8px 0;
  font-size: 1.1em;
}

.sensor-info {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.sensor-info p {
  margin: 5px 0;
  font-size: 0.95em;
  opacity: 0.9;
}

.ios-info {
  margin-top: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.ios-info p {
  margin: 8px 0;
  font-size: 0.9em;
}

.ios-info strong {
  color: #87CEEB;
}

.debug-info {
  margin-top: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: monospace;
  font-size: 0.85em;
  text-align: left;
}

.debug-info h3 {
  margin: 0 0 10px 0;
  color: #87CEEB;
  text-align: center;
}

.debug-info p {
  margin: 5px 0;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .canvas-container {
    width: 95vw;
    max-width: 95vw;
  }
  
  h1 {
    font-size: 2em;
  }
  
  .instructions {
    margin: 10px;
    padding: 15px;
  }
  
  .control-btn {
    padding: 10px 20px;
    font-size: 14px;
  }
  
  .app-container {
    padding: 10px;
  }
  
  .websocket-controls, .controls {
    width: 100%;
    max-width: 95vw;
  }
}
</style>