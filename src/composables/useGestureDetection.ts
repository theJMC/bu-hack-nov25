import { ref } from 'vue'

export interface GestureData {
  action: string
  intensity: number
  timestamp: number
  confidence: number
}

export interface SensorData {
  accelerationX: number
  accelerationY: number
  rotationAlpha: number
  rotationBeta: number
  rotationGamma: number
  velocityX: number
  velocityY: number
  velocityZ: number
  tiltVelocityBeta: number
  tiltVelocityGamma: number
}

export function useGestureDetection() {
  // Motion sensor data
  const sensorData = ref<SensorData>({
    accelerationX: 0,
    accelerationY: 0,
    rotationAlpha: 0,
    rotationBeta: 0,
    rotationGamma: 0,
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    tiltVelocityBeta: 0,
    tiltVelocityGamma: 0
  })

  // Calibration
  let calibratedBeta = 0
  let calibratedGamma = 0
  let isCalibrated = false

  // Improved gesture detection with consistent timing
  const gestureThreshold = 120 // Degrees per second (more predictable than frame-based)
  const gestureTimeoutMs = 500 // Minimum time between gestures
  const confidenceThreshold = 0.6 // Lower for more responsive detection
  let lastGestureTime = 0
  
  // Consistent velocity tracking with fixed time window
  const velocityWindow = 80 // 80ms window for velocity calculation
  let orientationHistory: Array<{ beta: number, gamma: number, timestamp: number }> = []
  
  // Jump state
  let jumpIntensity = 0
  let jumpActive = false
  let jumpStartTime = 0
  const jumpDuration = 800

  // Current action display
  const currentAction = ref('')
  const actionIntensity = ref(0)

  // Gesture callbacks
  let onGestureDetected: ((data: GestureData) => void) | null = null

  const setGestureCallback = (callback: (data: GestureData) => void) => {
    onGestureDetected = callback
  }

  // Improved velocity calculation with consistent timing
  const calculateVelocity = (history: typeof orientationHistory) => {
    if (history.length < 2) return { betaVel: 0, gammaVel: 0 }
    
    // Use consistent time window - find reading closest to velocityWindow ms ago
    const now = history[history.length - 1].timestamp
    const targetTime = now - velocityWindow
    
    let baseReading = history[0]
    for (const reading of history) {
      if (reading.timestamp <= targetTime) {
        baseReading = reading
      } else {
        break
      }
    }
    
    const currentReading = history[history.length - 1]
    const timeDiff = currentReading.timestamp - baseReading.timestamp
    
    if (timeDiff <= 0) return { betaVel: 0, gammaVel: 0 }
    
    // Calculate velocity in degrees per second
    const betaVel = ((currentReading.beta - baseReading.beta) / timeDiff) * 1000
    const gammaVel = ((currentReading.gamma - baseReading.gamma) / timeDiff) * 1000
    
    return { betaVel, gammaVel }
  }

  // Improved confidence calculation based on actual velocity consistency
  const calculateGestureConfidence = (
    direction: 'up' | 'down' | 'left' | 'right', 
    primaryVelocity: number,
    secondaryVelocity: number
  ): number => {
    // Base confidence from velocity strength
    const velocityStrength = Math.abs(primaryVelocity) / gestureThreshold
    const baseConfidence = Math.min(1.0, velocityStrength)
    
    // Penalty for conflicting movement in secondary axis
    const conflictPenalty = Math.min(0.3, Math.abs(secondaryVelocity) / gestureThreshold)
    
    // Bonus for clean, single-axis movement
    const cleanMovementBonus = Math.abs(primaryVelocity) > Math.abs(secondaryVelocity) * 2 ? 0.2 : 0
    
    const finalConfidence = Math.max(0, Math.min(1.0, baseConfidence - conflictPenalty + cleanMovementBonus))
    
    return finalConfidence
  }

  // Streamlined gesture detection
  const detectTiltGestures = (betaVel: number, gammaVel: number, timestamp: number) => {
    // Prevent gesture spam
    if (timestamp - lastGestureTime < gestureTimeoutMs) {
      return
    }
    
    // Log significant movements for debugging
    const totalVelocity = Math.sqrt(betaVel * betaVel + gammaVel * gammaVel)
    if (totalVelocity > 10) {
      console.log(`📊 Motion: β=${betaVel.toFixed(1)}°/s, γ=${gammaVel.toFixed(1)}°/s, total=${totalVelocity.toFixed(1)}°/s`)
    }
    
    let detectedGesture: GestureData | null = null
    
    // Check each gesture direction
    if (betaVel < -gestureThreshold) {
      // Tilt forward/up = Slide
      const confidence = calculateGestureConfidence('up', betaVel, gammaVel)
      if (confidence >= confidenceThreshold) {
        const intensity = Math.min(100, (Math.abs(betaVel) / gestureThreshold) * 60) // Scale to reasonable range
        detectedGesture = { 
          action: 'Slide', 
          intensity: Math.round(intensity), 
          timestamp,
          confidence: Math.round(confidence * 100)
        }
      }
    } else if (betaVel > gestureThreshold) {
      // Tilt backward/down = Jump
      const confidence = calculateGestureConfidence('down', betaVel, gammaVel)
      if (confidence >= confidenceThreshold) {
        const intensity = Math.min(100, (Math.abs(betaVel) / gestureThreshold) * 60)
        triggerJump(intensity)
        detectedGesture = { 
          action: 'Jump', 
          intensity: Math.round(intensity), 
          timestamp,
          confidence: Math.round(confidence * 100)
        }
      }
    } else if (gammaVel < -gestureThreshold) {
      // Tilt left = Dash Left
      const confidence = calculateGestureConfidence('left', gammaVel, betaVel)
      if (confidence >= confidenceThreshold) {
        const intensity = Math.min(100, (Math.abs(gammaVel) / gestureThreshold) * 60)
        detectedGesture = { 
          action: 'Dash Left', 
          intensity: Math.round(intensity), 
          timestamp,
          confidence: Math.round(confidence * 100)
        }
      }
    } else if (gammaVel > gestureThreshold) {
      // Tilt right = Dash Right
      const confidence = calculateGestureConfidence('right', gammaVel, betaVel)
      if (confidence >= confidenceThreshold) {
        const intensity = Math.min(100, (Math.abs(gammaVel) / gestureThreshold) * 60)
        detectedGesture = { 
          action: 'Dash Right', 
          intensity: Math.round(intensity), 
          timestamp,
          confidence: Math.round(confidence * 100)
        }
      }
    }
    
    // Handle detected gesture
    if (detectedGesture) {
      console.log(`🎯 ${detectedGesture.action}! Velocity: ${detectedGesture.action.includes('Slide') || detectedGesture.action.includes('Jump') ? betaVel.toFixed(1) : gammaVel.toFixed(1)}°/s, Intensity: ${detectedGesture.intensity}%, Confidence: ${detectedGesture.confidence}%`)
      
      currentAction.value = `${detectedGesture.action} (${detectedGesture.confidence}%)`
      actionIntensity.value = detectedGesture.intensity
      lastGestureTime = timestamp
      
      if (onGestureDetected) {
        onGestureDetected(detectedGesture)
      }
      
      // Clear action display
      setTimeout(() => {
        if (currentAction.value.includes(detectedGesture.action)) {
          currentAction.value = ''
          actionIntensity.value = 0
        }
      }, 1500)
    }
  }

  const handleDeviceMotion = (event: DeviceMotionEvent) => {
    if (event.acceleration) {
      sensorData.value.accelerationX = event.acceleration.x || 0
      sensorData.value.accelerationY = event.acceleration.y || 0
    }
  }

  const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    const newBeta = event.beta || 0
    const newGamma = event.gamma || 0
    const newAlpha = event.alpha || 0
    const timestamp = Date.now()
    
    // Maintain clean orientation history with consistent timing
    orientationHistory.push({ beta: newBeta, gamma: newGamma, timestamp })
    
    // Keep only recent history (3x velocity window for smooth calculation)
    const maxAge = velocityWindow * 3
    const cutoffTime = timestamp - maxAge
    orientationHistory = orientationHistory.filter(h => h.timestamp >= cutoffTime)
    
    // Update sensor data
    sensorData.value.rotationAlpha = newAlpha
    sensorData.value.rotationBeta = newBeta
    sensorData.value.rotationGamma = newGamma
    
    // Calculate velocity
    const { betaVel, gammaVel } = calculateVelocity(orientationHistory)
    sensorData.value.tiltVelocityBeta = betaVel
    sensorData.value.tiltVelocityGamma = gammaVel
    
    // Auto-calibrate
    if (!isCalibrated && (Math.abs(newBeta) > 0.1 || Math.abs(newGamma) > 0.1)) {
      calibratedBeta = newBeta
      calibratedGamma = newGamma
      isCalibrated = true
      console.log('🎯 Auto-calibrated:', { beta: newBeta.toFixed(2), gamma: newGamma.toFixed(2) })
    }
    
    // Detect gestures with sufficient history
    if (isCalibrated && orientationHistory.length >= 3) {
      detectTiltGestures(betaVel, gammaVel, timestamp)
    }
  }

  const triggerJump = (intensity: number) => {
    jumpIntensity = intensity
    jumpActive = true
    jumpStartTime = Date.now()
  }

  const calibrateDevice = () => {
    calibratedBeta = sensorData.value.rotationBeta
    calibratedGamma = sensorData.value.rotationGamma
    isCalibrated = true
    orientationHistory = []
    console.log('🎯 Device calibrated - position and history reset')
  }

  const getCalibratedPosition = (centerX: number, centerY: number, sensitivity: number = 8) => {
    if (!isCalibrated) return { x: centerX, y: centerY }
    
    const deltaGamma = (sensorData.value.rotationGamma - calibratedGamma) * sensitivity
    const deltaBeta = (sensorData.value.rotationBeta - calibratedBeta) * sensitivity
    
    return { x: centerX + deltaGamma, y: centerY + deltaBeta }
  }

  const getJumpState = () => {
    if (!jumpActive) return { isJumping: false, jumpOffset: 0 }
    
    const jumpProgress = (Date.now() - jumpStartTime) / jumpDuration
    if (jumpProgress >= 1) {
      jumpActive = false
      return { isJumping: false, jumpOffset: 0 }
    }
    
    const jumpHeight = (jumpIntensity / 100) * 150
    const jumpOffset = Math.sin(jumpProgress * Math.PI) * jumpHeight
    
    return { isJumping: true, jumpOffset }
  }

  return {
    currentAction,
    actionIntensity,
    sensorData,
    handleDeviceMotion,
    handleDeviceOrientation,
    setGestureCallback,
    calibrateDevice,
    triggerJump,
    getCalibratedPosition,
    getJumpState,
    getIsCalibrated: () => isCalibrated
  }
}