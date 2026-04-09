import { useEffect, useRef, useState } from 'react'
import { Terminal, AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

const BACKEND_WS = import.meta.env.VITE_BACKEND_WS || 'ws://localhost:5000'

export default function TerminalPanel({ token }) {
  const containerRef = useRef(null)
  const termRef      = useRef(null)
  const wsRef        = useRef(null)
  const fitRef       = useRef(null)
  const [status, setStatus]   = useState('disconnected') // connecting | connected | disconnected | error
  const [message, setMessage] = useState('')
  const [xtermLoaded, setXtermLoaded] = useState(false)

  // Load xterm.js from CDN dynamically
  useEffect(() => {
    if (window.Terminal) { setXtermLoaded(true); return }

    const linkCSS = document.createElement('link')
    linkCSS.rel  = 'stylesheet'
    linkCSS.href = 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css'
    document.head.appendChild(linkCSS)

    const scriptXterm = document.createElement('script')
    scriptXterm.src = 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js'
    scriptXterm.onload = () => {
      const scriptFit = document.createElement('script')
      scriptFit.src = 'https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js'
      scriptFit.onload = () => setXtermLoaded(true)
      document.head.appendChild(scriptFit)
    }
    document.head.appendChild(scriptXterm)
  }, [])

  const connect = () => {
    if (!xtermLoaded || !containerRef.current) return

    // Init xterm
    if (termRef.current) { termRef.current.dispose(); termRef.current = null }

    const term = new window.Terminal({
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor:     '#3fb950',
        selection:  'rgba(63,185,80,0.2)',
        black:      '#21262d',
        green:      '#3fb950',
        yellow:     '#d29922',
        red:        '#f85149',
        blue:       '#58a6ff',
        cyan:       '#56d364',
        white:      '#e6edf3',
        brightBlack:'#30363d',
      },
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
    })

    if (window.FitAddon) {
      const fit = new window.FitAddon.FitAddon()
      term.loadAddon(fit)
      fitRef.current = fit
    }

    term.open(containerRef.current)
    if (fitRef.current) { setTimeout(() => fitRef.current.fit(), 100) }
    termRef.current = term

    // Connect WebSocket
    setStatus('connecting')
    setMessage('')
    const ws = new WebSocket(`${BACKEND_WS}/terminal?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      term.writeln('\x1b[32m✓ Terminal connected\x1b[0m')
      term.writeln('\x1b[33mType commands and press Enter\x1b[0m')
      term.writeln('')
    }

    ws.onmessage = e => { term.write(e.data) }

    ws.onclose = (ev) => {
      setStatus('disconnected')
      if (ev.code === 4001) {
        setMessage('Auth failed — please reload the page')
        term.writeln('\r\n\x1b[31m✗ Connection closed: Authentication failed\x1b[0m')
      } else {
        term.writeln('\r\n\x1b[33m⚠ Connection closed. Click Reconnect.\x1b[0m')
      }
    }

    ws.onerror = () => {
      setStatus('error')
      setMessage('Cannot connect to terminal server. Make sure backend is running.')
      term.writeln('\r\n\x1b[31m✗ WebSocket error — is the backend running on port 5000?\x1b[0m')
      term.writeln('\x1b[33mRun: cd backend && npm run dev\x1b[0m')
    }

    // Send keystrokes to backend
    term.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })

    // Handle resize
    const resizeObs = new ResizeObserver(() => {
      if (fitRef.current) {
        fitRef.current.fit()
        if (ws.readyState === WebSocket.OPEN && termRef.current) {
          ws.send(JSON.stringify({
            type: 'resize',
            cols: termRef.current.cols,
            rows: termRef.current.rows,
          }))
        }
      }
    })
    if (containerRef.current) resizeObs.observe(containerRef.current)
    return () => resizeObs.disconnect()
  }

  useEffect(() => {
    if (xtermLoaded) connect()
    return () => {
      wsRef.current?.close()
      termRef.current?.dispose()
    }
  }, [xtermLoaded])

  return (
    <div className="flex flex-col h-full bg-canvas">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-default border-b border-border shrink-0">
        <Terminal size={13} className="text-green"/>
        <span className="text-xs font-semibold font-mono text-fg-default">Terminal</span>
        <div className="flex items-center gap-1.5 ml-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-green animate-pulse' :
            status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
            status === 'error' ? 'bg-red-400' : 'bg-fg-subtle'}`}/>
          <span className={`text-[10px] ${
            status === 'connected' ? 'text-green' :
            status === 'connecting' ? 'text-yellow-400' :
            status === 'error' ? 'text-red-400' : 'text-fg-subtle'}`}>
            {status}
          </span>
        </div>
        <button onClick={connect} className="ml-auto btn-ghost p-1" title="Reconnect">
          <RefreshCw size={11}/>
        </button>
      </div>

      {/* Warning banner */}
      {(status === 'disconnected' || status === 'error') && !xtermLoaded && (
        <div className="p-3 bg-yellow-400/8 border-b border-yellow-400/20">
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="text-yellow-400 shrink-0 mt-0.5"/>
            <div>
              <p className="text-xs font-semibold text-yellow-400 mb-1">Loading terminal...</p>
              <p className="text-[10px] text-yellow-400/70">Downloading xterm.js from CDN</p>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="px-3 py-2 bg-red-400/8 border-b border-red-400/20">
          <p className="text-[10px] text-red-400">{message}</p>
          <p className="text-[10px] text-fg-subtle mt-1">Make sure backend is running: <code className="bg-subtle px-1 rounded">cd backend && npm run dev</code></p>
        </div>
      )}

      {/* xterm container */}
      <div ref={containerRef} className="flex-1 p-2 overflow-hidden"
        style={{minHeight:0}}/>
    </div>
  )
}
