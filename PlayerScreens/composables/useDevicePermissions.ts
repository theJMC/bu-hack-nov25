import { ref } from 'vue'

export interface DebugInfo {
  userAgent: string
  isHTTPS: boolean
  hasDeviceMotion: boolean
  hasDeviceOrientation: boolean
  hasMotionPermission: boolean
  hasOrientationPermission: boolean
}

export function useDevicePermissions() {
  const permissionStatus = ref<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
  const supportsMotion = ref(false)
  
  const debugInfo = ref<DebugInfo>({
    userAgent: '',
    isHTTPS: false,
    hasDeviceMotion: false,
    hasDeviceOrientation: false,
    hasMotionPermission: false,
    hasOrientationPermission: false
  })

  // Request permissions for iOS 13+
  const requestMotionPermission = async () => {
    console.log('Requesting motion permissions...')
    
    try {
      let motionPermission = 'not-needed'
      let orientationPermission = 'not-needed'
      
      // Check if we're on iOS and need permissions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      console.log('iOS detected:', isIOS)
      console.log('User agent:', navigator.userAgent)
      
      // Request DeviceMotionEvent permission for iOS
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        console.log('Requesting DeviceMotionEvent permission...')
        motionPermission = await (DeviceMotionEvent as any).requestPermission()
        console.log('DeviceMotionEvent permission result:', motionPermission)
      } else {
        console.log('DeviceMotionEvent.requestPermission not available')
        motionPermission = 'granted'
      }
      
      // Request DeviceOrientationEvent permission for iOS
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        console.log('Requesting DeviceOrientationEvent permission...')
        orientationPermission = await (DeviceOrientationEvent as any).requestPermission()
        console.log('DeviceOrientationEvent permission result:', orientationPermission)
      } else {
        console.log('DeviceOrientationEvent.requestPermission not available')
        orientationPermission = 'granted'
      }
      
      // Update status based on permissions
      if (motionPermission === 'granted' && orientationPermission === 'granted') {
        permissionStatus.value = 'granted'
        console.log('✅ All permissions granted, motion sensors enabled')
        return true
      } else {
        permissionStatus.value = 'denied'
        console.log('❌ Permission denied:', { motionPermission, orientationPermission })
        return false
      }
    } catch (error) {
      console.error('💥 Error requesting device permissions:', error)
      permissionStatus.value = 'denied'
      return false
    }
  }

  const setupMotionListeners = (
    onDeviceMotion: (event: DeviceMotionEvent) => void,
    onDeviceOrientation: (event: DeviceOrientationEvent) => void
  ) => {
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', onDeviceMotion)
      supportsMotion.value = true
    }
    
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', onDeviceOrientation)
    }
  }

  const removeMotionListeners = (
    onDeviceMotion: (event: DeviceMotionEvent) => void,
    onDeviceOrientation: (event: DeviceOrientationEvent) => void
  ) => {
    window.removeEventListener('devicemotion', onDeviceMotion)
    window.removeEventListener('deviceorientation', onDeviceOrientation)
  }

  const initializePermissions = async (
    onDeviceMotion: (event: DeviceMotionEvent) => void,
    onDeviceOrientation: (event: DeviceOrientationEvent) => void
  ) => {
    // Populate debug information
    debugInfo.value = {
      userAgent: navigator.userAgent.includes('iPhone') ? 'iPhone' : navigator.userAgent.includes('iPad') ? 'iPad' : 'Other',
      isHTTPS: location.protocol === 'https:',
      hasDeviceMotion: typeof window.DeviceMotionEvent !== 'undefined',
      hasDeviceOrientation: typeof window.DeviceOrientationEvent !== 'undefined',
      hasMotionPermission: typeof (DeviceMotionEvent as any).requestPermission === 'function',
      hasOrientationPermission: typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    }
    
    console.log('🔍 Debug Info:', debugInfo.value)
    
    // Check if motion sensors are supported
    if (window.DeviceMotionEvent || window.DeviceOrientationEvent) {
      supportsMotion.value = true
      
      // For iOS 13+, we need to request permission for both motion and orientation
      const needsMotionPermission = typeof (DeviceMotionEvent as any).requestPermission === 'function'
      const needsOrientationPermission = typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      
      if (needsMotionPermission || needsOrientationPermission) {
        permissionStatus.value = 'unknown'
        console.log('iOS device detected, permissions required:', {
          motion: needsMotionPermission,
          orientation: needsOrientationPermission
        })
      } else {
        // For other devices, assume permission is granted
        permissionStatus.value = 'granted'
        setupMotionListeners(onDeviceMotion, onDeviceOrientation)
        console.log('Non-iOS device, motion sensors enabled automatically')
      }
    } else {
      permissionStatus.value = 'unsupported'
      console.error('Motion sensors not supported on this device')
    }
  }

  const requestAndSetupSensors = async (
    onDeviceMotion: (event: DeviceMotionEvent) => void,
    onDeviceOrientation: (event: DeviceOrientationEvent) => void
  ) => {
    const granted = await requestMotionPermission()
    if (granted) {
      setupMotionListeners(onDeviceMotion, onDeviceOrientation)
    }
    return granted
  }

  return {
    // Reactive state
    permissionStatus,
    supportsMotion,
    debugInfo,
    
    // Actions
    requestMotionPermission,
    setupMotionListeners,
    removeMotionListeners,
    initializePermissions,
    requestAndSetupSensors
  }
}