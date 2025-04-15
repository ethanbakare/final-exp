import { useState, useEffect, useRef } from 'react'

export function useAudioCapture(onAudioData: (data: Blob) => void) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    let chunks: Blob[] = []

    const setupMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)

        recorder.ondataavailable = (e) => {
          chunks.push(e.data)
        }

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' })
          onAudioData(blob)
          chunks = []
        }

        setMediaRecorder(recorder)
        mediaRecorderRef.current = recorder
        setError(null)
      } catch (err) {
        setError('Error accessing microphone')
        console.error(err)
      }
    }

    setupMediaRecorder()

    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [onAudioData])

  const startRecording = () => {
    if (mediaRecorder?.state === 'inactive') {
      mediaRecorder.start(1000) // Capture in 1-second chunks
      setIsRecording(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  return {
    isRecording,
    error,
    startRecording,
    stopRecording
  }
} 