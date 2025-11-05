import p5 from 'p5'
import type { SensorData } from '../composables/useGestureDetection'

export interface DotState {
  x: number
  y: number
  targetX: number
  targetY: number
  size: number
}

export interface SketchConfig {
  dotSize: number
  easing: number
  gyroSensitivity: number
}

export function createDotSketch(
  container: HTMLElement,
  getDotPosition: () => { x: number; y: number },
  getJumpState: () => { isJumping: boolean; jumpOffset: number },
  getCurrentAction: () => string,
  getActionIntensity: () => number,
  getSensorData: () => SensorData,
  getPermissionStatus: () => string,
  getIsCalibrated: () => boolean,
  config: SketchConfig = { dotSize: 30, easing: 0.08, gyroSensitivity: 8 }
) {
  let dotState: DotState = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    size: config.dotSize
  }

  const sketch = (p: p5) => {
    p.setup = () => {
      // Make canvas responsive to container size
      const containerWidth = container.clientWidth || 800
      const containerHeight = Math.min(containerWidth * 0.75, 600) // 4:3 aspect ratio, max 600px
      p.createCanvas(containerWidth, containerHeight)
      
      // Initialize dot position to center
      dotState.x = p.width / 2
      dotState.y = p.height / 2
      dotState.targetX = dotState.x
      dotState.targetY = dotState.y
      
      console.log(`📱 Canvas created: ${p.width}x${p.height}, Dot at: ${dotState.x}, ${dotState.y}`)
    }

    // Handle window resize
    p.windowResized = () => {
      const containerWidth = container.clientWidth || 800
      const containerHeight = Math.min(containerWidth * 0.75, 600)
      p.resizeCanvas(containerWidth, containerHeight)
      
      // Recenter dot after resize
      dotState.x = p.width / 2
      dotState.y = p.height / 2
      dotState.targetX = dotState.x
      dotState.targetY = dotState.y
      
      console.log(`📱 Canvas resized: ${p.width}x${p.height}, Dot recentered`)
    }

    p.draw = () => {
      p.background(20, 20, 30)
      
      // Get current states
      const jumpState = getJumpState()
      const currentAction = getCurrentAction()
      const actionIntensity = getActionIntensity()
      const sensorData = getSensorData()
      const permissionStatus = getPermissionStatus()
      const isCalibrated = getIsCalibrated()
      
      // Update target position
      const targetPos = getDotPosition()
      dotState.targetX = targetPos.x
      dotState.targetY = targetPos.y
      
      // Handle jump effect
      let currentDotY = dotState.y
      if (jumpState.isJumping) {
        currentDotY = dotState.y - jumpState.jumpOffset
      }
      
      // Smooth movement towards target
      dotState.x += (dotState.targetX - dotState.x) * config.easing
      dotState.y += (dotState.targetY - dotState.y) * config.easing
      
      // Keep dot within canvas bounds
      dotState.x = p.constrain(dotState.x, dotState.size/2, p.width - dotState.size/2)
      dotState.y = p.constrain(dotState.y, dotState.size/2, p.height - dotState.size/2)
      
      // Calculate movement speed for visual effects
      const deltaX = dotState.targetX - dotState.x
      const deltaY = dotState.targetY - dotState.y
      const speed = p.dist(0, 0, deltaX, deltaY)
      let colorIntensity = p.map(speed, 0, 100, 100, 255)
      colorIntensity = p.constrain(colorIntensity, 100, 255)
      
      // Draw trail effect
      p.stroke(100, 200, 255, 150)
      p.strokeWeight(3)
      p.line(dotState.x, currentDotY, dotState.x - deltaX * 0.5, currentDotY - deltaY * 0.5)
      
      // Draw jump trail if jumping
      if (jumpState.isJumping) {
        p.stroke(255, 200, 100, 200)
        p.strokeWeight(5)
        p.line(dotState.x, dotState.y, dotState.x, currentDotY)
      }
      
      // Dynamic dot size based on action intensity
      let currentDotSize = dotState.size
      if (actionIntensity > 0) {
        const sizeMultiplier = 1 + (actionIntensity / 100) * 0.8
        currentDotSize = dotState.size * sizeMultiplier
      }
      
      // Draw the main dot (at jump position if jumping)
      if (jumpState.isJumping) {
        // Special jump colors
        const jumpColor = p.map(jumpState.jumpOffset, 0, 150, 150, 255)
        p.fill(255, jumpColor, 100)
      } else {
        p.fill(colorIntensity, 100, 255)
      }
      p.noStroke()
      p.ellipse(dotState.x, currentDotY, currentDotSize, currentDotSize)
      
      // Draw a smaller inner dot
      p.fill(255, 255, 255, 200)
      p.ellipse(dotState.x, currentDotY, currentDotSize * 0.4, currentDotSize * 0.4)
      
      // Draw gesture action display
      if (currentAction) {
        p.fill(255, 255, 100, 220)
        p.textAlign(p.CENTER)
        p.textSize(24)
        p.text(currentAction, p.width / 2, 100)
        p.textSize(18)
        p.text(`Intensity: ${actionIntensity}%`, p.width / 2, 130)
      }
      
      // Draw sensor data and instructions
      drawDebugInfo(p, sensorData, permissionStatus, isCalibrated, dotState, currentAction, actionIntensity)
      drawInstructions(p, permissionStatus)
    }
  }

  const drawDebugInfo = (
    p: p5, 
    sensorData: SensorData, 
    permissionStatus: string, 
    isCalibrated: boolean, 
    dotState: DotState,
    currentAction: string,
    actionIntensity: number
  ) => {
    p.fill(255, 255, 255, 150)
    p.textAlign(p.LEFT)
    p.textSize(12)
    
    if (permissionStatus === 'granted') {
      p.text(`Gyro - Beta: ${sensorData.rotationBeta.toFixed(1)}° Gamma: ${sensorData.rotationGamma.toFixed(1)}°`, 10, 20)
      p.text(`Accel - X: ${sensorData.accelerationX.toFixed(2)} Y: ${sensorData.accelerationY.toFixed(2)}`, 10, 35)
      p.text(`Tilt Velocity - Beta: ${sensorData.tiltVelocityBeta.toFixed(2)} Gamma: ${sensorData.tiltVelocityGamma.toFixed(2)}`, 10, 50)
      p.text(`Motion Velocity - X: ${sensorData.velocityX.toFixed(2)} Y: ${sensorData.velocityY.toFixed(2)}`, 10, 65)
      p.text(`Calibrated: ${isCalibrated ? 'Yes' : 'No'}`, 10, 80)
      p.text(`Dot Position: ${dotState.x.toFixed(0)}, ${dotState.y.toFixed(0)}`, 10, 95)
      p.text(`Target Position: ${dotState.targetX.toFixed(0)}, ${dotState.targetY.toFixed(0)}`, 10, 110)
      if (currentAction) {
        p.text(`Action: ${currentAction} (${actionIntensity}%)`, 10, 125)
      }
    }
  }

  const drawInstructions = (p: p5, permissionStatus: string) => {
    p.textAlign(p.CENTER)
    p.textSize(16)
    if (permissionStatus === 'unknown') {
      p.text('Tap "Enable Motion" to use gesture controls!', p.width / 2, p.height - 60)
    } else if (permissionStatus === 'granted') {
      p.text('Tilt to move • Quick tilt up for Slide, down for jump, left/right to dash!', p.width / 2, p.height - 60)
      p.textSize(12)
      p.text('Tap "Calibrate" to reset center position', p.width / 2, p.height - 40)
    } else {
      p.text('Motion sensors not available or permission denied', p.width / 2, p.height - 60)
    }
  }

  // Method to reset dot position (for calibration)
  const resetDotPosition = (p5Instance: p5) => {
    dotState.x = p5Instance.width / 2
    dotState.y = p5Instance.height / 2
    dotState.targetX = dotState.x
    dotState.targetY = dotState.y
  }

  return {
    sketch,
    resetDotPosition,
    getDotState: () => ({ ...dotState })
  }
}