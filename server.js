const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const WebSocket = require('ws')
const OpenAI = require('openai')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const PORT = parseInt(process.env.PORT || '3001', 10) // Match Next.js default port

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const wss = new WebSocket.Server({ server })

  wss.on('connection', (ws) => {
    console.log('Client connected')

    ws.on('message', async (message) => {
      try {
        const audio = JSON.parse(message.toString())
        const response = await openai.audio.transcriptions.create({
          file: audio,
          model: "whisper-1"
        })
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

  server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${PORT}`)
  })
}) 