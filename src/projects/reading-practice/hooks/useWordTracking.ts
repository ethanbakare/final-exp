import { useState, useEffect } from "react"
import type { WordTrackingState } from "../types"

export function useWordTracking(socket: WebSocket | null, passage: string[]) {
  const [highlightedWords, setHighlightedWords] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socket) return

    // Connection opened
    socket.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    // Connection error
    socket.onerror = (event) => {
      setError('WebSocket connection error')
      setIsConnected(false)
    }

    // Connection closed
    socket.onclose = () => {
      setIsConnected(false)
    }

    // Message handling
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.error) {
          setError(data.error)
          return
        }

        const spokenWords = data.text.split(" ")
        const matchedIndexes = spokenWords.map((word: string) => 
          passage.findIndex((passageWord: string) => 
            passageWord.toLowerCase() === word.toLowerCase()
          )
        ).filter((index: number) => index !== -1)

        setHighlightedWords(matchedIndexes)
      } catch (error) {
        setError('Error processing message')
      }
    }
  }, [socket, passage])

  return { highlightedWords, error, isConnected }
} 