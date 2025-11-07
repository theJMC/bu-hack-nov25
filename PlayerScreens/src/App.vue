<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGestureDetection, type GestureData } from '../composables/useGestureDetection'
import { useWebSocket } from '../composables/useWebSocket'
import { useDevicePermissions } from '../composables/useDevicePermissions'

import gernot from './assets/gernot.png'
import ben from './assets/ben.png'
import emili from './assets/emili.png'
import tim from './assets/tim.png'

const lecturers = [
  gernot, ben, emili, tim
]

const gameCode = ref('')
const isJoining = ref(false)
const isConnected = ref(false)
const gameState = ref('join') // 'join' | 'connected'

// Initialize WebSocket composable without game code initially
let webSocketComposable: ReturnType<typeof useWebSocket> | null = null
  
  // Gesture detection
  const gestureEnabled = ref(false)
  const {
    currentAction,
    actionIntensity,
    handleDeviceMotion,
    handleDeviceOrientation,
    setGestureCallback,
    calibrateDevice,
    getIsCalibrated
  } = useGestureDetection()
  
  // Reactive refs for WebSocket state
  const wsUrl = ref('')
  const wsConnected = ref(false)
  const wsError = ref('')
  const playerNum = ref(0)

const {
  permissionStatus: _permissionStatus,
  supportsMotion: _supportsMotion,
  debugInfo: _debugInfo,
  requestAndSetupSensors,
  removeMotionListeners
} = useDevicePermissions()

const joinGame = async () => {
  if (!gameCode.value.trim()) {
    alert('Please enter a game code')
    return
  }
  
  isJoining.value = true
  
  try {
    // Initialize WebSocket composable with the game code
    webSocketComposable = useWebSocket(gameCode.value)

    // Update reactive refs
    wsUrl.value = webSocketComposable.wsUrl.value
    wsConnected.value = webSocketComposable.wsConnected.value
    wsError.value = webSocketComposable.wsError.value
    
    webSocketComposable.connectWebSocket()
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (webSocketComposable.wsConnected.value) {
      console.log('Connected to game:', gameCode.value)
      isConnected.value = true
      gameState.value = 'connected'
      isJoining.value = false
      
      // Update our reactive refs
      wsConnected.value = webSocketComposable.wsConnected.value
      console.log("WebSocket connected:", wsConnected.value);
    } else {
      throw new Error('Failed to connect to WebSocket')
    }
    
  } catch (error) {
    console.error('Failed to join game:', error)
    alert('Failed to join game. Please check the code and try again.')
    isJoining.value = false
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    joinGame()
  }
}

// Game action functions
const performAction = (action: string, intensity: number = 75) => {
  console.log(`Performing ${action} with intensity ${intensity}%`)
  
  // Create gesture data object
  const gestureData: GestureData = {
    action: action,
    intensity: intensity,
    timestamp: Date.now(),
    confidence: 1.0
  }
  
  // Send using WebSocket composable
  if (webSocketComposable) {
    console.log("sending data")
    webSocketComposable.sendActionData(gestureData)
  }
}

// Gesture detection setup
const onGesture = (gestureData: GestureData) => {
  if (gestureEnabled.value && webSocketComposable) {
    // Send gesture data directly using WebSocket composable
    webSocketComposable.sendActionData(gestureData)
  }
}

const toggleGestureControls = async () => {
  if (!gestureEnabled.value) {
    // Request permission and enable using the composable
    try {
      const granted = await requestAndSetupSensors(handleDeviceMotion, handleDeviceOrientation)
      
      if (granted) {
        gestureEnabled.value = true
        calibrateDevice()
        console.log('Gesture controls enabled')
      } else {
        alert('Motion permission is required for gesture controls')
        return
      }
    } catch (error) {
      console.error('Error enabling gesture controls:', error)
      alert('Failed to enable gesture controls')
    }
  } else {
    // Disable
    gestureEnabled.value = false
    removeMotionListeners(handleDeviceMotion, handleDeviceOrientation)
    console.log('Gesture controls disabled')
  }
}

const clickAction = (action: string) => {
  if (!gestureEnabled.value) {
    performAction(action, 75)
  }
}

const leaveGame = () => {
  // Cleanup WebSocket connection
  if (webSocketComposable) {
    webSocketComposable.cleanup()
    webSocketComposable = null
  }
  
  isConnected.value = false
  gameState.value = 'join'
  gameCode.value = ''
  gestureEnabled.value = false
  wsConnected.value = false
  wsUrl.value = ''
  wsError.value = ''
  
  // Clear localStorage
  localStorage.removeItem('gameCode')
}

// Setup gesture detection
onMounted(() => {
  setGestureCallback(onGesture)
  // Initialize permissions but don't set up listeners yet
  // They will be set up when user toggles gesture controls
})

// Cleanup
onUnmounted(() => {
  if (webSocketComposable) {
    webSocketComposable.cleanup()
  }
  
  // Remove listeners using the composable
  removeMotionListeners(handleDeviceMotion, handleDeviceOrientation)
})
</script>

<template>
  <!-- Join Game Screen -->
  <section v-if="gameState === 'join'" class="join-game-container">
    <div class="join-game-card">
      <h1 class="title">Join Game</h1>
      
      <div class="input-group">
        <label for="gameCode" class="label">Game Code</label>
        <input
          id="gameCode"
          v-model="gameCode"
          type="text"
          placeholder="Enter game code"
          class="game-code-input"
          :disabled="isJoining"
          @keypress="handleKeyPress"
          maxlength="10"
        />
      </div>
      
      <button
        @click="joinGame"
        :disabled="isJoining || !gameCode.trim()"
        class="join-button"
      >
        <span v-if="isJoining">Connecting...</span>
        <span v-else>Join Game</span>
      </button>
      
      <div v-if="wsError" class="error-message">
        {{ wsError }}
      </div>
    </div>
  </section>

  <!-- Game Controls Screen -->
  <section v-if="gameState === 'connected'" class="game-controls-container">
    <div class="game-header">
      <h2 class="game-title">Game: {{ gameCode }}</h2>
      <div class="header-controls">
        <button 
          @click="toggleGestureControls" 
          :class="['gesture-toggle', { active: gestureEnabled }]"
        >
          <span class="toggle-icon">{{ gestureEnabled ? '📱' : '👆' }}</span>
          {{ gestureEnabled ? 'Gesture On' : 'Gesture Off' }}
        </button>
        <button @click="leaveGame" class="leave-button">Leave</button>
      </div>
    </div>

    <div class="controls-info">
      <div class="split-container">
        <div class="control-info-half">
            <div class="controls-header">
                <h3 class="controls-title">
                  {{ gestureEnabled ? 'Gesture Controls' : 'Tap Controls' }}
                </h3>
                <div v-if="gestureEnabled && currentAction" class="current-action">
                  {{ currentAction }} - {{ actionIntensity }}%
                </div>
                <div v-if="gestureEnabled" class="calibration-status">
                  {{ getIsCalibrated() ? '✅ Calibrated' : '⏳ Move device to calibrate' }}
                </div>
                <div class="connection-status">
                  <span :class="['status-text', { connected: wsConnected }]">
                    {{ wsConnected ? '🟢 Connected' : '🔴 Disconnected' }}
                  </span>
                </div>
            </div>
        </div>

        <div class="image-half">
            <figure>
                <img :src="lecturers[playerNum]" alt="Visualization of controls or gesture device">
                <figcaption>Visual guide for device control gestures.</figcaption>
            </figure>
        </div>
      </div>

      <div class="controls-grid">
        
        <!-- Shake Gesture -->
        <div 
          :class="['control-card', { clickable: !gestureEnabled, active: currentAction && currentAction.includes('Shake') }]"
          @click="clickAction('Shake')"
        >
          <div class="gesture-icon shake-icon">📱</div>
          <h4 class="gesture-name">Shake</h4>
          <p class="gesture-description">
            {{ gestureEnabled ? 'Shake your device horizontally' : 'Tap to shake' }}
          </p>
          <div class="gesture-hint">
            {{ gestureEnabled ? 'Quick horizontal movement' : 'Click me!' }}
          </div>
        </div>

        <!-- Slide Gesture -->
        <div 
          :class="['control-card', { clickable: !gestureEnabled, active: currentAction && currentAction.includes('Slide') }]"
          @click="clickAction('Slide')"
        >
          <div class="gesture-icon Slide-icon">⬇️</div>
          <h4 class="gesture-name">Slide</h4>
          <p class="gesture-description">
            {{ gestureEnabled ? 'Tilt device forward/up quickly' : 'Tap to Slide' }}
          </p>
          <div class="gesture-hint">
            {{ gestureEnabled ? 'Tilt away from you' : 'Click me!' }}
          </div>
        </div>

        <!-- Jump Gesture -->
        <div 
          :class="['control-card', { clickable: !gestureEnabled, active: currentAction && currentAction.includes('Jump') }]"
          @click="clickAction('Jump')"
        >
          <div class="gesture-icon jump-icon">⬆️</div>
          <h4 class="gesture-name">Jump</h4>
          <p class="gesture-description">
            {{ gestureEnabled ? 'Tilt device backward/down quickly' : 'Tap to jump' }}
          </p>
          <div class="gesture-hint">
            {{ gestureEnabled ? 'Tilt toward you' : 'Click me!' }}
          </div>
        </div>

        <!-- Calibration -->
        <div v-if="gestureEnabled" class="control-card calibration-card">
          <div class="gesture-icon calibrate-icon">🎯</div>
          <h4 class="gesture-name">Auto Calibration</h4>
          <p class="gesture-description">Device auto-calibrates when you start moving</p>
          <div class="gesture-hint">Move device to begin</div>
        </div>

      </div>

      <div class="instructions">
        <h4>{{ gestureEnabled ? 'Gesture Instructions:' : 'Tap Instructions:' }}</h4>
        <ul v-if="gestureEnabled">
          <li>Hold your device comfortably</li>
          <li>Move device to auto-calibrate</li>
          <li>Perform gestures to control the game</li>
          <li>Intensity matters - faster movements = stronger actions</li>
        </ul>
        <ul v-else>
          <li>Tap the control cards above to perform actions</li>
          <li>Enable gesture controls for motion-based gameplay</li>
          <li>Each tap sends a medium intensity action</li>
        </ul>
      </div>
    </div>

    <div class="status-bar">
      <span class="status-text">WebSocket URL: {{ wsUrl }}</span>
    </div>
  </section>
</template>

<style scoped>
/* Join Game Styles */
.join-game-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.join-game-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 30px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.input-group {
  margin-bottom: 30px;
  text-align: left;
}

.label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
}

.game-code-input {
  width: 100%;
  padding: 16px;
  font-size: 1.2rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.game-code-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.game-code-input:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.join-button {
  width: 100%;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.join-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.join-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.join-button:active:not(:disabled) {
  transform: translateY(0);
}

.error-message {
  margin-top: 20px;
  padding: 12px;
  background: #fee;
  color: #c33;
  border: 1px solid #fcc;
  border-radius: 8px;
  font-size: 0.9rem;
}

/* Game Controls Styles */
.game-controls-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  display: flex;
  flex-direction: column;
  user-select: none;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.game-title {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.gesture-toggle {
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.gesture-toggle.active {
  background: rgba(46, 204, 113, 0.3);
  border-color: rgba(46, 204, 113, 0.5);
}

.gesture-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.gesture-toggle.active:hover {
  background: rgba(46, 204, 113, 0.4);
}

.toggle-icon {
  font-size: 1.1rem;
}

.leave-button {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.leave-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Controls Info Styles */
.controls-info {
  flex: 1;
  padding: 30px;
}

.controls-header {
  text-align: center;
  margin-bottom: 30px;
}

.controls-title {
  color: white;
  font-size: 2rem;
  margin-bottom: 15px;
  font-weight: bold;
}

.current-action {
  color: #2ecc71;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.calibration-status {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.connection-status {
  margin-bottom: 10px;
}

.connection-status .status-text {
  color: #e74c3c;
  font-size: 0.9rem;
  font-weight: bold;
}

.connection-status .status-text.connected {
  color: #2ecc71;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.control-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 25px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.control-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-5px);
}

.control-card.clickable {
  cursor: pointer;
  border-color: rgba(255, 215, 0, 0.3);
}

.control-card.clickable:hover {
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.5);
  transform: translateY(-8px);
}

.control-card.active {
  background: rgba(46, 204, 113, 0.2);
  border-color: rgba(46, 204, 113, 0.5);
  transform: scale(1.05);
}

.gesture-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  display: block;
}

.shake-icon {
  animation: shake 2s infinite;
}

.Slide-icon {
  animation: Slide 2s infinite;
}

.jump-icon {
  animation: jump 2s infinite;
}

.calibrate-icon {
  animation: pulse 2s infinite;
}

.gesture-name {
  color: white;
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.gesture-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  line-height: 1.4;
  margin-bottom: 10px;
}

.gesture-hint {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  font-style: italic;
}

.calibration-card {
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.3);
}

.instructions {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.instructions h4 {
  color: white;
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.instructions ul {
  color: rgba(255, 255, 255, 0.8);
  list-style: none;
  padding: 0;
}

.instructions li {
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
}

.instructions li::before {
  content: '•';
  color: #667eea;
  position: absolute;
  left: 0;
  font-weight: bold;
}

/* Status Bar */
.status-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
}

.status-text {
  color: white;
  font-size: 0.8rem;
  opacity: 0.7;
}

/* 1. Main Container Setup */
.split-container {
    display: flex; /* Enables flexible layout */
    width: 100%; /* Use full available width or set a fixed width (e.g., 800px) */
    /* Optional: Set a minimum height if the left side content is very short */
    /* min-height: 250px; */ 
}

/* 2. Styling for Both Halves */
.control-info-half,
.image-half {
    width: 50%; /* Key: Makes each side exactly half */
    padding: 15px;
    box-sizing: border-box; /* Includes padding within the 50% width */
}

/* 3. Styling for the Controls Content (Left) */
.control-info-half {
    /* Optional: Align items within your controls-header if needed */
}

/* 4. Styling for the Image Side (Right) */
.image-half {
    display: flex; /* Use flex to easily center the image/figure */
    justify-content: center;
    align-items: center;
    text-align: center;
}

/* 5. Image and Caption Specific Styles */
.image-half figure {
    margin: 0; /* Remove default figure margin */
    width: 50%;
}

.image-half img {
    max-width: 90%; /* Keep the image slightly smaller than the container */
    height: auto;
    display: block;
    margin: 0 auto;
}

.image-half figcaption {
    margin-top: 10px;
    font-size: 0.85em;
    color: #666;
}

/* Animations */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes Slide {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(10px); }
}

@keyframes jump {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .header-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .controls-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .controls-info {
    padding: 20px;
  }
  
  .controls-title {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
  
  .control-card {
    padding: 15px;
  }
  
  .gesture-icon {
    font-size: 2.5rem;
  }
  
  .join-game-card {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .title {
    font-size: 2rem;
  }
}
</style>
