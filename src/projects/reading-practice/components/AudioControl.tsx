import React from 'react'
import { useAudioCapture } from '../hooks/useAudioCapture'

interface AudioControlProps {
  onAudioData: (data: Blob) => void
}

export const AudioControl: React.FC<AudioControlProps> = ({ onAudioData }) => {
  const {
    isRecording,
    error,
    startRecording,
    stopRecording
  } = useAudioCapture(onAudioData)

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded-full ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-green-500 hover:bg-green-600'
        } text-white transition-colors`}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  )
} 