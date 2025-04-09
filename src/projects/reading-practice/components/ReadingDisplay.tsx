import React from 'react'
import type { ReadingPassage } from '../types'
import { useWordTracking } from '../hooks/useWordTracking'
import { useWebSocket } from '../hooks/useWebSocket'
import { AudioControl } from './AudioControl'

interface ReadingDisplayProps {
  passage: ReadingPassage
}

export const ReadingDisplay: React.FC<ReadingDisplayProps> = ({
  passage
}) => {
  const wsUrl = typeof window !== 'undefined' 
    ? `ws://${window.location.host}/api/reading-practice/stream`
    : ''
    
  const { socket, isConnected, error: wsError, sendMessage } = useWebSocket(wsUrl)
  const { highlightedWords, error: trackingError } = useWordTracking(socket, passage.text)
  const progress = (highlightedWords.length / passage.text.length) * 100

  const handleAudioData = (audioBlob: Blob) => {
    sendMessage({ audio: audioBlob })
  }

  const error = wsError || trackingError

  return (
    <div className="space-y-4">
      <AudioControl onAudioData={handleAudioData} />
      
      {/* Connection Status */}
      <div className={`text-sm ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
        {isConnected ? 'Connected' : 'Connecting...'}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error}
        </div>
      )}

      {passage.title && (
        <h2 className="text-xl font-semibold">{passage.title}</h2>
      )}
      
      {/* Progress Bar */}
      <div className="h-2 w-full bg-gray-200 rounded-full">
        <div 
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Reading Text */}
      <div className="text-lg leading-relaxed">
        {passage.text.map((word, index) => (
          <span
            key={index}
            className={`mx-0.5 ${
              highlightedWords.includes(index) 
                ? 'text-green-600 font-medium' 
                : 'text-gray-700'
            }`}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  )
} 