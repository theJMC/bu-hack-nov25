import { ref } from 'vue'
import type { GestureData } from './useGestureDetection'

export function useWebSocket(gameCode: string) {
  console.log("WebSocket gameCode:", gameCode);

  // Select Backend Server
    switch (window.location.hostname) {
        case "localhost":
            var hostname = localStorage.getItem("api-server") || `dash.bedbugz.uk`;
            break;
        case "dash.bedbugz.uk":
        case "remote.dash.bedbugz.uk":
        case "host.dash.bedbugz.uk":
            var hostname = `dash.bedbugz.uk`;
            break;
        default:
            var hostname = `dash.bedbugz.uk`;
    }

  const wsUrl = ref(`wss://${hostname}/ws/${gameCode.toLowerCase().trim()}/player`)
  console.log("hello",wsUrl)
  let websocket: WebSocket | null = null
  const wsConnected = ref(false)
  const wsError = ref('')
  const playerNum = ref(0);

  const connectWebSocket = () => {
    try {
      websocket = new WebSocket(wsUrl.value)
      websocket.onopen = () => {
        wsConnected.value = true
        wsError.value = ''
        console.log('✅ WebSocket connected')
      }
      
      websocket.onclose = () => {
        wsConnected.value = false
        console.log('❌ WebSocket disconnected')
      }
      
      websocket.onerror = (error) => {
        wsError.value = 'WebSocket connection failed'
        console.error('💥 WebSocket error:', error)
      }
      
      websocket.onmessage = (event) => {
        var jsonEvent = JSON.parse(event.data);
        console.log(jsonEvent);
        switch (jsonEvent.code) {
          case 201: 
            console.log(`Joined as Player ${jsonEvent.playerNum}`);
            if (jsonEvent.playerNum !== undefined) {
              playerNum.value = jsonEvent.playerNum;
            }
            break;
          default:
            console.log('📨 Received:', jsonEvent)
        }
      }
    } catch (error) {
      wsError.value = 'Failed to create WebSocket connection'
      console.error('💥 WebSocket creation error:', error)
    }
  }

  const disconnectWebSocket = () => {
    if (websocket) {
      websocket.close()
      websocket = null
    }
  }

  const sendActionData = (gestureData: GestureData) => {
    if (websocket && wsConnected.value) {
      const data = {
        code: 202,
        action: gestureData.action,
        intensity: gestureData.intensity,
        timestamp: gestureData.timestamp,
      }
      websocket.send(JSON.stringify(data))
      console.log('📤 Sent action data:', data)
    }
  }

  const sendMessage = (message: any) => {
    if (websocket && wsConnected.value) {
      websocket.send(JSON.stringify(message))
      console.log('📤 Sent message:', message)
    }
  }

  // Cleanup function
  const cleanup = () => {
    disconnectWebSocket()
  }

  return {
    // Reactive state
    wsUrl,
    wsConnected,
    wsError,
    playerNum,
    
    // Actions
    connectWebSocket,
    disconnectWebSocket,
    sendActionData,
    sendMessage,
    cleanup
  }
}