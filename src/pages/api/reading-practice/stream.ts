import { NextApiRequest } from 'next'
import { NextApiResponse } from 'next'
import OpenAI from 'openai'
import { Server as WebSocketServer } from 'ws'
import { Socket } from 'net'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Define server interface
interface ServerWithWebsocket {
  ws: WebSocketServer;
}

// Add type for Next.js extended socket
interface ExtendedSocket extends Socket {
  server: ServerWithWebsocket;
}

// Store WebSocket server instance
let wss: WebSocketServer | null = null

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!wss) {
    // Initialize WebSocket server
    wss = new WebSocketServer({ 
      noServer: true 
    })

    // Handle WebSocket connections
    wss.on('connection', (ws) => {
      console.log('Client connected')

      // Handle incoming audio chunks
      ws.on('message', async (message) => {
        try {
          const audio = JSON.parse(message.toString())
          const response = await openai.audio.transcriptions.create({
            file: audio,
            model: "whisper-1"
          })
          // Send transcription back immediately
          ws.send(JSON.stringify({ text: response.text }))
        } catch (error) {
          console.error('Error:', error)
          ws.send(JSON.stringify({ error: 'Error processing audio' }))
        }
      })

      ws.on('close', () => {
        console.log('Client disconnected')
      })
    })

    // Upgrade HTTP connection to WebSocket
    const socket = req.socket as ExtendedSocket
    if (socket.server.ws) {
      console.log('WebSocket server already attached')
      return res.end()
    }

    // Attach WebSocket server to Next.js server
    socket.server.ws = wss
  }

  // Handle WebSocket upgrade
  if (req.headers['upgrade'] === 'websocket') {
    wss.handleUpgrade(req, req.socket, Buffer.from(''), (ws) => {
      wss!.emit('connection', ws, req)
    })
  } else {
    res.status(400).json({ message: 'Expected WebSocket connection' })
  }
} 