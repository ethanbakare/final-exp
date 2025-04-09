import { useState, useEffect, useCallback } from 'react'

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ws: WebSocket | null = null

    if (typeof window !== 'undefined') {
      ws = new WebSocket(url)

      ws.onopen = () => {
        setIsConnected(true)
        setError(null)
      }

      ws.onerror = () => {
        setError('WebSocket connection error')
        setIsConnected(false)
      }

      ws.onclose = () => {
        setIsConnected(false)
      }

      setSocket(ws)
    }

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [url])

  const sendMessage = useCallback((data: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data))
    }
  }, [socket])

  return {
    socket,
    isConnected,
    error,
    sendMessage
  }
} 