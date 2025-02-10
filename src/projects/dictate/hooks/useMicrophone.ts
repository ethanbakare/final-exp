import { useRef, useCallback, useEffect } from 'react'

interface UseMicrophoneProps {
  onTranscription: (text: string) => void
  onError?: (error: Error) => void
}

export const useMicrophone = ({ onTranscription, onError }: UseMicrophoneProps) => {
  const eventSourceRef = useRef<EventSource | null>(null)
  const isRecordingRef = useRef(false)

  useEffect(() => {
    return () => {
      console.log('Cleanup: closing EventSource')
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        stopRecording()
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    console.log('🎯 StartRecording Called')
    try {
      console.log('Starting recording process')
      if (isRecordingRef.current) {
        console.log('Already recording, skipping')
        return
      }

      // First establish SSE connection
      console.log('🔄 Setting up SSE connection first')
      if (eventSourceRef.current) {
        console.log('Closing existing EventSource')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      // Create new EventSource and wait for connection
      console.log('Creating new EventSource')
      eventSourceRef.current = new EventSource('/api/dictate/record?stream=true')
      
      await new Promise((resolve, reject) => {
        if (!eventSourceRef.current) {
          reject(new Error('Failed to create EventSource'))
          return
        }

        const timeoutId = setTimeout(() => {
          reject(new Error('EventSource connection timeout'))
        }, 5000) // 5 second timeout

        eventSourceRef.current.onopen = () => {
          console.log('🟢 EventSource Connected')
          clearTimeout(timeoutId)
          resolve(true)
        }

        eventSourceRef.current.onerror = (error) => {
          console.log('❌ EventSource Connection Error:', error)
          clearTimeout(timeoutId)
          reject(error)
        }
      })

      // Now start the recording
      console.log('Starting recording after SSE connection established')
      const startResponse = await fetch('/api/dictate/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' })
      })

      if (!startResponse.ok) {
        throw new Error(`Failed to start recording: ${startResponse.statusText}`)
      }

      console.log('Recording started successfully')
      
      if (eventSourceRef.current) {
        // Set up message handler
        eventSourceRef.current.onmessage = (event) => {
          console.log('📨 SSE Message Received:', {
            type: event.type,
            data: event.data,
            lastEventId: event.lastEventId
          })
          try {
            const data = JSON.parse(event.data)
            console.log('Parsed message data:', data)
            
            if (data.message_type === 'PartialTranscript' && data.text) {
              console.log('Processing transcription:', data.text)
              onTranscription(data.text)
            }
          } catch (error) {
            console.error('Error processing SSE message:', error)
            onError?.(new Error('Failed to parse transcription'))
          }
        }

        isRecordingRef.current = true
      }

    } catch (error) {
      console.error('Error in startRecording:', error)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      isRecordingRef.current = false
      onError?.(error instanceof Error ? error : new Error('Failed to start recording'))
    }
  }, [onTranscription, onError])

  const stopRecording = useCallback(async () => {
    console.log('Stopping recording')
    try {
      if (!isRecordingRef.current) {
        console.log('Not recording, nothing to stop')
        return
      }

      if (eventSourceRef.current) {
        console.log('Closing EventSource')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      const response = await fetch('/api/dictate/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stop' })
      })

      if (!response.ok) {
        throw new Error(`Failed to stop recording: ${response.statusText}`)
      }

      console.log('Recording stopped successfully')

    } catch (error) {
      console.error('Error in stopRecording:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to stop recording'))
    } finally {
      isRecordingRef.current = false
    }
  }, [onError])

  return {
    startRecording,
    stopRecording,
    isRecording: isRecordingRef.current
  }
}


// TODO: