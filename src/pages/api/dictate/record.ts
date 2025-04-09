// src/pages/api/dictate/record.ts
import { NextApiRequest, NextApiResponse } from 'next';
import * as recorder from 'node-record-lpcm16';
import WebSocket from 'ws';

let recordingInstance: recorder.Recording | null = null;
let wsInstance: WebSocket | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.body;
  console.log('API Route called with action:', action);
  console.log('API Key:', process.env.ASSEMBLYAI_API_KEY ? 'Present' : 'Missing');

  // Handle GET requests for EventSource
  if (req.method === 'GET' && req.query.stream === 'true') {
    console.log('Setting up SSE connection');
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // TEST: Send immediate test message
    res.write(`data: ${JSON.stringify({ type: "TEST", message: "If you see this, SSE is working" })}\n\n`);
    console.log('Sent test SSE message');
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`);
    console.log('Sent initial SSE connection message');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  switch (action) {
    case 'start': {
      console.log('Starting new recording session');
      if (recordingInstance || wsInstance) {
        try {
          if (recordingInstance) {
            recordingInstance.stop();
            recordingInstance = null;
          }
          if (wsInstance?.readyState === WebSocket.OPEN) {
            wsInstance.close();
          }
          wsInstance = null;
        } catch (error) {
          console.error('Error cleaning up existing session:', error);
        }
      }

      try {
        if (!process.env.ASSEMBLYAI_API_KEY) {
          throw new Error('AssemblyAI API Key is missing');
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        console.log('API Key available:', !!process.env.ASSEMBLYAI_API_KEY);
        console.log('API Key length:', process.env.ASSEMBLYAI_API_KEY?.length);

        wsInstance = new WebSocket('wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000', {
          headers: {
            Authorization: process.env.ASSEMBLYAI_API_KEY
          }
        });

        wsInstance.on('open', () => {
          console.log('Connected to AssemblyAI WebSocket');
          
          recordingInstance = recorder.record({
            sampleRate: 16000,
            channels: 1
          });

          recordingInstance.stream()
            .on('data', (chunk: Buffer) => {
              if (wsInstance?.readyState === WebSocket.OPEN) {
                const audioData = chunk.toString('base64');
                try {
                  const message = JSON.stringify({ audio_data: audioData });
                  console.log('Sending audio chunk, length:', message.length);
                  wsInstance.send(message);
                } catch (error) {
                  console.error('Error sending audio:', error);
                }
              } else {
                console.log('WebSocket not ready, state:', wsInstance?.readyState);
              }
            })
            .on('error', (error: Error) => {
              console.error('Recording stream error:', error);
            });
        });

        wsInstance.on('message', (message) => {
          console.log('Raw WebSocket message received');
          try {
            const msg = JSON.parse(message.toString());
            console.log('Parsed WebSocket message:', JSON.stringify(msg, null, 2));
            
            if (msg.message_type === 'PartialTranscript' && msg.text) {
              console.log('Sending transcript to client:', msg.text);
              if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify(msg)}\n\n`);
                console.log('Successfully sent SSE message');
              } else {
                console.log('Response ended, cannot send SSE');
              }
            }
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
          }
        });

        wsInstance.on('error', (error) => {
          console.error('WebSocket error:', error);
        });

        wsInstance.on('close', (code, reason) => {
          console.log('WebSocket closed:', code, reason?.toString());
        });

        req.on('close', () => {
          console.log('Client disconnected, cleaning up');
          if (recordingInstance) {
            recordingInstance.stop();
            recordingInstance = null;
          }
          if (wsInstance?.readyState === WebSocket.OPEN) {
            wsInstance.close();
          }
          wsInstance = null;
        });

      } catch (error) {
        console.error('Error in start action:', error);
        if (!res.writableEnded) {
          res.status(500).json({ error: 'Failed to start recording' });
        }
      }
      break;
    }

    case 'stop': {
      console.log('Stopping recording session');
      try {
        if (recordingInstance) {
          recordingInstance.stop();
          recordingInstance = null;
        }
        if (wsInstance?.readyState === WebSocket.OPEN) {
          wsInstance.close();
        }
        wsInstance = null;
        res.status(200).json({ message: 'Recording stopped' });
      } catch (error) {
        console.error('Error in stop action:', error);
        res.status(500).json({ error: 'Failed to stop recording' });
      }
      break;
    }

    default:
      res.status(400).json({ error: 'Invalid action' });
  }
}

export const config = {
  api: {
    bodyParser: true
  }
};