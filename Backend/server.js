require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const helmet    = require('helmet')
const mongoose  = require('mongoose')
const http      = require('http')
const WebSocket = require('ws')
const jwt       = require('jsonwebtoken')

const app    = express()
const server = http.createServer(app)
const PORT   = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'devflow-secret'

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10mb' }))

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(e => console.log('⚠️  MongoDB skipped:', e.message))
}

app.use('/api/auth',   require('./routes/auth'))
app.use('/api/repo',   require('./routes/repo'))
app.use('/api/ai',     require('./routes/ai'))
app.use('/api/deploy', require('./routes/deploy'))
app.use('/api/pr',     require('./routes/pr'))
app.get('/api/health', (_, res) => res.json({ status:'ok', service:'DevFlow AI' }))
app.use((err, _req, res, _next) => res.status(500).json({ error: err.message }))

// ── WebSocket Terminal ──────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server, path: '/terminal' })

wss.on('connection', (ws, req) => {
  // Auth check from query param
  const url   = new URL(req.url, `http://${req.headers.host}`)
  const token = url.searchParams.get('token')

  if (!token) { ws.close(4001, 'No token'); return }
  try { jwt.verify(token, JWT_SECRET) }
  catch { ws.close(4001, 'Invalid token'); return }

  // Spawn a real shell
  let pty
  try {
    const nodePty = require('node-pty')
    const shell   = process.platform === 'win32' ? 'cmd.exe' : 'bash'
    pty = nodePty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80, rows: 24,
      cwd: process.env.HOME || '/tmp',
      env: process.env,
    })
    console.log('Terminal spawned, PID:', pty.pid)
  } catch (e) {
    // node-pty not installed — send helpful message
    ws.send('\r\n\x1b[33m⚠  node-pty not found. Run: npm install node-pty\x1b[0m\r\n')
    ws.send('\x1b[33mTerminal requires native build tools (node-gyp).\x1b[0m\r\n')
    ws.close(); return
  }

  // PTY → browser
  pty.onData(data => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data)
  })

  pty.onExit(() => {
    if (ws.readyState === WebSocket.OPEN) ws.close()
  })

  // Browser → PTY
  ws.on('message', msg => {
    try {
      const data = JSON.parse(msg)
      if (data.type === 'input')  pty.write(data.data)
      if (data.type === 'resize') pty.resize(data.cols, data.rows)
    } catch {
      pty.write(msg) // raw input fallback
    }
  })

  ws.on('close', () => { try { pty.kill() } catch {} })
})

server.listen(PORT, () => console.log(`🚀 DevFlow AI → http://localhost:${PORT}`))
