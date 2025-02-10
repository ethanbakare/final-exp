// src/pages/api/dictate/ws.ts
import { NextApiRequest } from 'next';
import { WebSocket, WebSocketServer } from 'ws';
import * as recorder from 'node-record-lpcm16';

const wsServer = new WebSocketServer({ noServer: true });
const clients = new Set<WebSocket>();
let recordingInstance: recorder.Recording | null = null;
let assemblyAIWs: WebSocket | null = null;
let isRecording = false;  // Add this flag

// Cleanup any existing connections
function cleanup() {
  if (recordingInstance) {
    recordingInstance.stop();
    recordingInstance = null;
  }
  if (assemblyAIWs?.readyState === WebSocket.OPEN) {
    assemblyAIWs.close(1000);
    assemblyAIWs = null;
  }
  isRecording = false;
}

wsServer.on('connection', (ws) => {
  console.log('🔄 Client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('🔄 Client disconnected');
    clients.delete(ws);
    if (clients.size === 0) {
      cleanup();  // Cleanup when all clients disconnect
    }
  });
});

function startRecording() {
  if (isRecording) return;
  isRecording = true;

  cleanup();  // Ensure clean state

  assemblyAIWs = new WebSocket('wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000', {
    headers: {
      Authorization: process.env.ASSEMBLYAI_API_KEY || ''
    }
  });

  assemblyAIWs.on('open', () => {
    if (!isRecording) return;  // Don't start if cancelled
    console.log('✅ Connected to AssemblyAI');
    
    recordingInstance = recorder.record({
      sampleRate: 16000,
      channels: 1
    });

    recordingInstance.stream()
      .on('data', (chunk: Buffer) => {
        if (assemblyAIWs?.readyState === WebSocket.OPEN && isRecording) {
          const audioData = chunk.toString('base64');
          assemblyAIWs.send(JSON.stringify({ audio_data: audioData }));
        }
      });
  });

  assemblyAIWs.on('message', (message) => {
    if (!isRecording) return;  // Don't process if stopped
    try {
      const msg = JSON.parse(message.toString());
      if (msg.text && msg.confidence > 0) {
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
          }
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  assemblyAIWs.on('error', (error) => {
    console.error('AssemblyAI WebSocket error:', error);
    cleanup();
  });

  assemblyAIWs.on('close', () => {
    console.log('AssemblyAI connection closed');
    cleanup();
  });
}

function stopRecording() {
  cleanup();
}

export default function handler(req: NextApiRequest, res: any) {
  if (!res.socket.server.ws) {
    res.socket.server.ws = wsServer;

    res.socket.server.on('upgrade', (request: any, socket: any, head: any) => {
      wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request);
      });
    });
  }

  if (req.method === 'POST') {
    const action = req.body.action;
    if (action === 'start') {
      startRecording();
      res.json({ status: 'started' });
    } else if (action === 'stop') {
      stopRecording();
      res.json({ status: 'stopped' });
    }
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: true,
  }
};