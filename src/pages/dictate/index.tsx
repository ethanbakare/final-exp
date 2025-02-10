// src/pages/dictate/index.tsx
import { useState, useEffect, useCallback } from 'react';
import { useMicrophone } from '@/projects/dictate/hooks/useMicrophone';

const TestPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = useCallback((info: string) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${info}`);
    setDebugInfo(prev => [...prev, `${timestamp} - ${info}`].slice(-5));
  }, []);

  useEffect(() => {
    console.log('Transcript updated:', currentTranscript);
    addDebugInfo(`Transcript updated: ${currentTranscript}`);
  }, [currentTranscript, addDebugInfo]);

  const transcriptionCallback = useCallback((text: string) => {
    console.log('💬 CALLBACK TRIGGERED with:', text);
    console.log('TRANSCRIPTION CALLBACK RECEIVED:', text);
    console.log('Received transcription:', text);
    addDebugInfo(`Received: ${text}`);
    setCurrentTranscript(text);
  }, [addDebugInfo]);

  const { startRecording, stopRecording } = useMicrophone({
    onTranscription: transcriptionCallback,
    onError: (error: Error) => {
      console.error('Error:', error);
      addDebugInfo(`Error: ${error.message}`);
    }
  });

  const handleToggleRecording = async () => {
    console.log('🔵 Toggle Button Clicked')
    console.log('Toggle recording, current state:', !isRecording);
    try {
      if (isRecording) {
        console.log('🔴 Stopping recording')
        await stopRecording();
        setIsRecording(false);
        addDebugInfo('Stopped recording');
      } else {
        console.log('🟢 Starting recording')
        setCurrentTranscript('');
        await startRecording();
        setIsRecording(true);
        addDebugInfo('Started recording');
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      addDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  return (
    <div style={{ padding: '20px' }}>
      <h1>Microphone Test</h1>
      
      <button 
        onClick={handleToggleRecording}
        style={{
          padding: '10px 20px',
          backgroundColor: isRecording ? 'red' : 'green',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>

      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        minHeight: '100px',
        backgroundColor: '#f5f5f5'
      }}>
        <h2>Transcribed Text:</h2>
        <p style={{ 
          whiteSpace: 'pre-wrap',
          minHeight: '50px',
          padding: '10px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '3px'
        }}>
          {currentTranscript || 'No transcription yet...'}
        </p>
      </div>

      {/* Add Debug Panel */}
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        width: '400px',
        padding: '15px',
        backgroundColor: 'black',
        color: 'lime',
        fontFamily: 'monospace',
        fontSize: '12px',
        borderRadius: '5px',
        zIndex: 1000,
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ color: 'white', marginTop: 0, marginBottom: '10px' }}>Debug Info</h3>
        {debugInfo.map((info, index) => (
          <div key={index} style={{ 
            marginBottom: '5px',
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap'
          }}>
            {info}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestPage;