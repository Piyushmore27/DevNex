import { useState, useEffect, useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import {
  Github, LogOut, Zap, Shield, Rocket, GitPullRequest,
  Save, X, Bot, RefreshCw, FilePlus, FolderPlus, Upload,
  Loader2, ChevronRight, ChevronDown, Folder, FolderOpen,
  Terminal, Eye, EyeOff, Link, FolderGit2, Plus, Play, Wand2
} from 'lucide-react'
import CoPilotPanel    from '../components/panels/CoPilotPanel'
import AgentPanel      from '../components/panels/AgentPanel'
import BugScannerPanel from '../components/panels/BugScannerPanel'
import DeployPanel     from '../components/panels/DeployPanel'
import PRReviewPanel   from '../components/panels/PRReviewPanel'
import TerminalPanel   from '../components/panels/TerminalPanel'
import { connectRepo, getFileTree, getFile, saveFile, getMe } from '../utils/api'

// ── Constants ─────────────────────────────────────────────────────────────────
const PANELS = [
  { id:'agent',    icon:<Wand2 size={14}/>,          label:'AI Agent',    color:'text-green' },
  { id:'copilot',  icon:<Bot size={14}/>,             label:'AI Chat',     color:'text-green' },
  { id:'bugs',     icon:<Shield size={14}/>,           label:'Bug Scanner', color:'text-yellow-400' },
  { id:'deploy',   icon:<Rocket size={14}/>,           label:'Deployment',  color:'text-blue-400' },
  { id:'pr',       icon:<GitPullRequest size={14}/>,   label:'PR Review',   color:'text-purple-400' },
  { id:'terminal', icon:<Terminal size={14}/>,       label:'Terminal',    color:'text-green' },
]

const EXT_LANG = {
  js:'javascript', jsx:'javascript', ts:'typescript', tsx:'typescript',
  json:'json', md:'markdown', css:'css', html:'html', htm:'html',
  py:'python', sh:'shell', yml:'yaml', yaml:'yaml',
  txt:'plaintext', env:'plaintext', gitignore:'plaintext',
  vue:'html', svelte:'html', php:'php', rb:'ruby', go:'go',
  java:'java', c:'c', cpp:'cpp', cs:'csharp', rs:'rust',
}
function getLang(p) { return EXT_LANG[p?.split('.').pop()?.toLowerCase()] || 'plaintext' }

const FILE_COLORS = {
  js:'#f7df1e', jsx:'#61dafb', ts:'#3178c6', tsx:'#61dafb', json:'#6b9f6b',
  md:'#8b949e', css:'#264de4', html:'#e34c26', htm:'#e34c26', py:'#3776ab',
  sh:'#4eaa25', yml:'#cb171e', yaml:'#cb171e', env:'#ecc94b', vue:'#42b883',
  svelte:'#ff3e00', php:'#777bb4', rb:'#cc342d', go:'#00acd7', rs:'#dea584',
}
function getFileIcon(path, size=10) {
  const ext = path?.split('.').pop()?.toLowerCase()
  return <span style={{ fontSize: size, color: FILE_COLORS[ext] || '#6e7681' }}>●</span>
}
function canPreview(path) {
  const ext = path?.split('.').pop()?.toLowerCase()
  return ['html','htm','css','js','jsx','svg','txt','md'].includes(ext)
}

// ── Project Templates ─────────────────────────────────────────────────────────
const TEMPLATES = {
  'HTML + CSS + JS': {
    icon: '🌐',
    desc: 'Simple web page with styles and script',
    files: [
      { path:'index.html', content:`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>My App</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body>
  <div class="container">
    <h1>Hello World 👋</h1>
    <p>Edit this file to get started.</p>
    <button id="btn">Click Me</button>
  </div>
  <script src="script.js"></script>
</body>
</html>` },
      { path:'style.css', content:`* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', sans-serif;
  background: #0d1117;
  color: #e6edf3;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.container { text-align: center; padding: 2rem; }
h1 { font-size: 2.5rem; margin-bottom: 1rem; color: #3fb950; }
p { color: #8b949e; margin-bottom: 1.5rem; }
button {
  padding: 0.75rem 2rem;
  background: #238636;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
button:hover { background: #2ea043; }` },
      { path:'script.js', content:`document.getElementById('btn').addEventListener('click', () => {
  alert('Button clicked! Start building your app here.')
})

console.log('App loaded successfully!')` },
    ]
  },
  'React App (No Build)': {
    icon: '⚛️',
    desc: 'React via CDN — works in browser preview',
    files: [
      { path:'index.html', content:`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>React App</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0d1117; color: #e6edf3; }
    .app { max-width: 600px; margin: 4rem auto; padding: 2rem; text-align: center; }
    h1 { color: #3fb950; margin-bottom: 1rem; }
    button { padding: 0.5rem 1.5rem; background: #238636; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 1rem; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="App.jsx"></script>
</body>
</html>` },
      { path:'App.jsx', content:`function Counter() {
  const [count, setCount] = React.useState(0)
  return (
    <div className="app">
      <h1>⚛️ React App</h1>
      <p>Count: <strong>{count}</strong></p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(0)} style={{marginLeft:'0.5rem', background:'#da3633'}}>Reset</button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Counter/>)` },
    ]
  },
  'Node.js API (GitHub)': {
    icon: '🟢',
    desc: 'Express REST API — push to GitHub + deploy',
    files: [
      { path:'server.js', content:`const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// Sample data
let todos = [
  { id: 1, text: 'Learn Node.js', done: false },
  { id: 2, text: 'Build an API', done: true },
]

app.get('/', (req, res) => res.json({ message: 'Todo API running!' }))
app.get('/todos', (req, res) => res.json(todos))
app.post('/todos', (req, res) => {
  const todo = { id: Date.now(), text: req.body.text, done: false }
  todos.push(todo)
  res.status(201).json(todo)
})
app.put('/todos/:id', (req, res) => {
  const todo = todos.find(t => t.id === parseInt(req.params.id))
  if (!todo) return res.status(404).json({ error: 'Not found' })
  todo.done = !todo.done
  res.json(todo)
})

app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`))` },
      { path:'package.json', content:JSON.stringify({
        name: 'my-api', version: '1.0.0', main: 'server.js',
        scripts: { start: 'node server.js', dev: 'nodemon server.js' },
        dependencies: { express: '^4.18.2' },
        devDependencies: { nodemon: '^3.0.2' }
      }, null, 2) },
      { path:'.env.example', content:`PORT=3000\nNODE_ENV=development` },
      { path:'README.md', content:`# My API\n\n## Setup\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Endpoints\n\n- GET /todos\n- POST /todos\n- PUT /todos/:id` },
      { path:'.github/workflows/deploy.yml', content:`name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm test --if-present
      - run: echo "Add your deploy step here"` },
    ]
  },
  'Landing Page': {
    icon: '🎨',
    desc: 'Beautiful landing page template',
    files: [
      { path:'index.html', content:`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>My Product</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body>
  <nav class="nav">
    <div class="logo">⚡ MyProduct</div>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <button class="btn-primary">Get Started</button>
    </div>
  </nav>
  <section class="hero">
    <h1>Build <span class="accent">Faster</span> Than Ever</h1>
    <p>The platform for modern developers. Ship features, not bugs.</p>
    <div class="hero-btns">
      <button class="btn-primary">Start Free →</button>
      <button class="btn-ghost">See Demo</button>
    </div>
  </section>
  <section class="features" id="features">
    <h2>Why choose us?</h2>
    <div class="grid">
      <div class="card">🚀 <h3>Fast</h3><p>10x faster deployment</p></div>
      <div class="card">🛡 <h3>Secure</h3><p>Bank-grade security</p></div>
      <div class="card">⚡ <h3>Smart</h3><p>AI-powered suggestions</p></div>
    </div>
  </section>
  <script src="app.js"></script>
</body>
</html>` },
      { path:'style.css', content:`*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#0d1117;color:#e6edf3}
.nav{display:flex;align-items:center;justify-content:space-between;padding:1rem 4rem;border-bottom:1px solid #30363d;position:sticky;top:0;background:#0d1117}
.logo{font-size:1.2rem;font-weight:700;color:#3fb950}
.nav-links{display:flex;align-items:center;gap:1.5rem}
.nav-links a{color:#8b949e;text-decoration:none}.nav-links a:hover{color:#e6edf3}
.hero{text-align:center;padding:8rem 2rem 5rem}
h1{font-size:3.5rem;font-weight:700;line-height:1.2;margin-bottom:1.5rem}
.accent{color:#3fb950}
p{color:#8b949e;font-size:1.2rem;margin-bottom:2rem}
.hero-btns{display:flex;gap:1rem;justify-content:center}
.btn-primary{padding:.75rem 1.5rem;background:#238636;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1rem;font-weight:500}
.btn-primary:hover{background:#2ea043}
.btn-ghost{padding:.75rem 1.5rem;background:transparent;color:#e6edf3;border:1px solid #30363d;border-radius:6px;cursor:pointer;font-size:1rem}
.features{padding:5rem 4rem;background:#161b22}
h2{text-align:center;font-size:2rem;margin-bottom:3rem}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
.card{background:#0d1117;border:1px solid #30363d;border-radius:12px;padding:2rem;text-align:center}
.card h3{margin:.5rem 0;color:#3fb950}.card p{color:#8b949e;font-size:.9rem}` },
      { path:'app.js', content:`document.querySelector('.btn-primary').addEventListener('click', () => {
  alert('Welcome! Start building your product here.')
})` },
    ]
  },
  'Python Script': {
    icon: '🐍',
    desc: 'Python script with README',
    files: [
      { path:'main.py', content:`# Main Python Script
def greet(name):
    """Return a greeting message."""
    return f"Hello, {name}! Welcome to Python."

def add(a, b):
    """Add two numbers."""
    return a + b

if __name__ == "__main__":
    print(greet("World"))
    print(f"2 + 3 = {add(2, 3)}")` },
      { path:'requirements.txt', content:`# Add your dependencies here\n# e.g. requests==2.31.0` },
      { path:'README.md', content:`# My Python Project\n\n## Run\n\n\`\`\`bash\npython main.py\n\`\`\`` },
    ]
  },
}

// ── Terminal Panel ─────────────────────────────────────────────────────────────
function TerminalPanel() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState('')
  const copy = (cmd) => {
    navigator.clipboard.writeText(cmd)
    setCopied(cmd)
    setTimeout(() => setCopied(''), 1500)
  }
  const CMDS = [
    { cat:'Setup', items:[
      { label:'Install all packages',  cmd:'npm install' },
      { label:'Install a package',     cmd:'npm install package-name' },
      { label:'Install dev package',   cmd:'npm install -D package-name' },
      { label:'Remove package',        cmd:'npm uninstall package-name' },
    ]},
    { cat:'Run', items:[
      { label:'Start dev server',      cmd:'npm run dev' },
      { label:'Start server',          cmd:'npm start' },
      { label:'Build for production',  cmd:'npm run build' },
      { label:'Run tests',             cmd:'npm test' },
      { label:'Run Python file',       cmd:'python main.py' },
    ]},
    { cat:'Git', items:[
      { label:'Git status',            cmd:'git status' },
      { label:'Add + commit + push',   cmd:'git add . && git commit -m "update" && git push' },
      { label:'Pull latest',           cmd:'git pull origin main' },
      { label:'Create new branch',     cmd:'git checkout -b feature/my-feature' },
    ]},
    { cat:'Create React App', items:[
      { label:'Create React + Vite',   cmd:'npm create vite@latest my-app -- --template react' },
      { label:'Create Next.js app',    cmd:'npx create-next-app@latest my-app' },
      { label:'Create Express app',    cmd:'npx express-generator my-app' },
    ]},
  ]
  return (
    <div className="flex flex-col h-full bg-canvas font-mono text-xs">
      <div className="panel-header">
        <Terminal size={13} className="text-green"/>
        <span className="panel-title text-xs font-mono">Commands</span>
        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-yellow-400/15 text-yellow-400 border border-yellow-400/25">copy to run locally</span>
      </div>
      <div className="p-2 bg-red-400/8 border-b border-border">
        <p className="text-[10px] text-red-400 leading-relaxed">⚠ Browser cannot run commands. Copy any command and paste in your local terminal (VS Code terminal, CMD, or PowerShell).</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {CMDS.map(section => (
          <div key={section.cat}>
            <p className="text-[9px] font-semibold text-fg-subtle uppercase tracking-widest mb-1.5 px-1">{section.cat}</p>
            {section.items.map((item, i) => (
              <div key={i} onClick={() => copy(item.cmd)}
                className="flex items-center justify-between gap-2 px-2 py-2 rounded cursor-pointer hover:bg-subtle transition-all group mb-0.5">
                <div className="min-w-0">
                  <div className="text-[10px] text-fg-muted truncate">{item.label}</div>
                  <div className="text-[11px] text-green font-mono truncate">{item.cmd}</div>
                </div>
                <div className="shrink-0 text-[9px] font-medium transition-all opacity-0 group-hover:opacity-100"
                  style={{color: copied===item.cmd ? '#3fb950' : '#6e7681'}}>
                  {copied === item.cmd ? '✓ copied' : 'copy'}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-border">
        <div className="flex gap-1">
          <input value={input} onChange={e=>setInput(e.target.value)}
            placeholder="type custom command..."
            className="flex-1 bg-subtle border border-border rounded px-2 py-1.5 text-[11px] text-fg-default outline-none placeholder:text-fg-subtle focus:border-green"
            onKeyDown={e => e.key==='Enter' && input.trim() && copy(input.trim())}
          />
          <button onClick={() => input.trim() && copy(input.trim())}
            className="px-2.5 py-1.5 rounded text-[10px] font-medium shrink-0"
            style={{background:'rgba(63,185,80,0.15)',color:'#3fb950',border:'1px solid rgba(63,185,80,0.3)'}}>
            Copy
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Live Preview Panel ─────────────────────────────────────────────────────────
function LivePreview({ tabs }) {
  const [previewSrc, setPreviewSrc] = useState('')
  const iframeRef = useRef(null)

  const buildPreview = useCallback(() => {
    // Find HTML file to use as base
    const htmlTab = tabs.find(t => t.path.endsWith('.html') || t.path.endsWith('.htm'))
    if (!htmlTab) return setPreviewSrc('')

    let html = htmlTab.content || ''

    // Inline CSS files referenced in HTML
    tabs.filter(t => t.path.endsWith('.css')).forEach(css => {
      const filename = css.path.split('/').pop()
      html = html.replace(
        new RegExp(`<link[^>]*href=["']${filename}["'][^>]*>`, 'g'),
        `<style>${css.content}</style>`
      )
    })

    // Inline JS files referenced in HTML
    tabs.filter(t => t.path.endsWith('.js') && !t.path.endsWith('.jsx')).forEach(js => {
      const filename = js.path.split('/').pop()
      html = html.replace(
        new RegExp(`<script[^>]*src=["']${filename}["'][^>]*><\/script>`, 'g'),
        `<script>${js.content}</script>`
      )
    })

    // Inline JSX files (for React CDN setup)
    tabs.filter(t => t.path.endsWith('.jsx')).forEach(jsx => {
      const filename = jsx.path.split('/').pop()
      html = html.replace(
        new RegExp(`<script[^>]*src=["']${filename}["'][^>]*><\/script>`, 'g'),
        `<script type="text/babel">${jsx.content}</script>`
      )
    })

    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    setPreviewSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [tabs])

  useEffect(() => { buildPreview() }, [buildPreview])

  const hasHtml = tabs.some(t => t.path.endsWith('.html') || t.path.endsWith('.htm'))

  if (!hasHtml) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6 bg-canvas">
      <Eye size={28} className="text-fg-subtle"/>
      <p className="text-sm font-semibold text-fg-default">No HTML file open</p>
      <p className="text-xs text-fg-muted leading-relaxed">Open or create an <code className="bg-subtle px-1.5 py-0.5 rounded text-[11px]">index.html</code> file to see live preview.</p>
      <p className="text-xs text-fg-subtle">Or use a template: AI Co-pilot → Generate</p>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-canvas">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-default border-b border-border shrink-0">
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full bg-red-400"/>
          <div className="w-3 h-3 rounded-full bg-yellow-400"/>
          <div className="w-3 h-3 rounded-full bg-green"/>
        </div>
        <span className="text-[11px] text-fg-subtle flex-1 text-center truncate">Live Preview</span>
        <button onClick={buildPreview}
          className="p-1 rounded hover:bg-subtle text-fg-subtle hover:text-green transition-all" title="Refresh preview">
          <RefreshCw size={11}/>
        </button>
      </div>
      {previewSrc ? (
        <iframe ref={iframeRef} src={previewSrc}
          className="flex-1 w-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-modals"
          title="Live Preview"/>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-fg-muted">
          <Loader2 size={14} className="animate-spin mr-2 text-green"/>Building preview...
        </div>
      )}
    </div>
  )
}

// ── File Tree ──────────────────────────────────────────────────────────────────
function TreeNode({ name, node, depth=0, onFileClick, activeFile, onAddFile, onAddFolder, addingIn, onAddConfirm, onAddCancel }) {
  const [open, setOpen] = useState(depth < 2)
  const [hovered, setHovered] = useState(false)
  const isFile = !!node.__file

  if (isFile) {
    const active = activeFile === node.__file.path
    return (
      <div onClick={() => onFileClick(node.__file)}
        className={`flex items-center gap-1.5 py-[3px] rounded cursor-pointer transition-all group
          ${active ? 'bg-green/15 text-green' : 'text-fg-muted hover:bg-subtle hover:text-fg-default'}`}
        style={{ paddingLeft: depth * 12 + 8 }}>
        {getFileIcon(name)}
        <span className="text-xs truncate flex-1">{name}</span>
      </div>
    )
  }

  const children = Object.entries(node)
    .filter(([k]) => k !== '__file')
    .sort(([,a],[,b]) => (!!b.__file)-(!!a.__file))

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 py-[3px] rounded cursor-pointer text-fg-muted hover:bg-subtle hover:text-fg-default transition-all"
        style={{ paddingLeft: depth * 12 + 8 }}>
        {open ? <ChevronDown size={11} className="shrink-0"/> : <ChevronRight size={11} className="shrink-0"/>}
        {open ? <FolderOpen size={11} className="shrink-0" style={{color:'#dcb67a'}}/> : <Folder size={11} className="shrink-0" style={{color:'#dcb67a'}}/>}
        <span className="text-xs truncate flex-1">{name}</span>
        {hovered && (
          <div className="flex gap-0.5 ml-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => onAddFile(name)} className="p-0.5 rounded hover:bg-overlay text-fg-subtle hover:text-green" title="New file"><FilePlus size={10}/></button>
            <button onClick={() => onAddFolder(name)} className="p-0.5 rounded hover:bg-overlay text-fg-subtle hover:text-blue-400" title="New folder"><FolderPlus size={10}/></button>
          </div>
        )}
      </div>
      {open && (
        <div>
          {addingIn?.folder === name && (
            <InlineInput type={addingIn.type} depth={depth+1}
              onConfirm={n => onAddConfirm(n, name)} onCancel={onAddCancel}/>
          )}
          {children.map(([k, v]) => (
            <TreeNode key={k} name={k} node={v} depth={depth+1}
              onFileClick={onFileClick} activeFile={activeFile}
              onAddFile={onAddFile} onAddFolder={onAddFolder}
              addingIn={addingIn} onAddConfirm={onAddConfirm} onAddCancel={onAddCancel}/>
          ))}
        </div>
      )}
    </div>
  )
}

function InlineInput({ type, depth, onConfirm, onCancel }) {
  const [val, setVal] = useState('')
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div className="flex items-center gap-1.5 py-0.5 rounded border border-green/40 bg-overlay mx-1"
      style={{ paddingLeft: depth * 12 + 8 }}>
      {type === 'folder'
        ? <Folder size={10} style={{color:'#dcb67a'}} className="shrink-0"/>
        : <span className="text-[9px] text-fg-subtle shrink-0">●</span>}
      <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
        placeholder={type === 'folder' ? 'folder-name' : 'filename.js'}
        className="bg-transparent text-xs text-fg-default outline-none flex-1 py-0.5"
        onKeyDown={e => {
          if (e.key === 'Enter' && val.trim()) onConfirm(val.trim())
          if (e.key === 'Escape') onCancel()
        }}/>
    </div>
  )
}

function buildTree(files) {
  const root = {}
  files.forEach(f => {
    const parts = f.path.split('/')
    let node = root
    parts.forEach((p, i) => {
      if (i === parts.length - 1) node[p] = { __file: f }
      else { if (!node[p]) node[p] = {}; node = node[p] }
    })
  })
  return root
}

// ── Main IDE ───────────────────────────────────────────────────────────────────
export default function IDE({ onLogout }) {
  const [user, setUser]               = useState(null)
  const [repoUrl, setRepoUrl]         = useState('')
  const [repo, setRepo]               = useState(JSON.parse(localStorage.getItem('devflow_repo')||'null'))
  const [ghFiles, setGhFiles]         = useState([])  // files from GitHub
  const [openTabs, setOpenTabs]       = useState([])  // local working files
  const [activeTab, setActiveTab]     = useState(null)
  const [activePanel, setActivePanel] = useState('copilot')
  const [panelOpen, setPanelOpen]     = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [connecting, setConnecting]   = useState(false)
  const [loadingTree, setLoadingTree] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [pushing, setPushing]         = useState(false)
  const [status, setStatus]           = useState('')
  const [addingIn, setAddingIn]       = useState(null)
  const [showRootAdd, setShowRootAdd] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const editorRef = useRef(null)

  const activeTabData = openTabs.find(t => t.path === activeTab) || null
  const fileContent   = activeTabData?.content || ''
  const fileName      = activeTab?.split('/').pop() || ''
  const hasHtml       = openTabs.some(t => t.path.endsWith('.html') || t.path.endsWith('.htm'))

  useEffect(() => { getMe().then(setUser).catch(()=>{}) }, [])
  useEffect(() => { if (repo) loadTree() }, [repo])

  const showStatus = (msg, ms=3000) => { setStatus(msg); setTimeout(() => setStatus(''), ms) }

  const loadTree = async () => {
    if (!repo) return
    setLoadingTree(true)
    try {
      const { files: f } = await getFileTree(repo.owner, repo.repo, repo.defaultBranch)
      setGhFiles(f || [])
    } catch(e) { showStatus('Error: ' + e.message) }
    setLoadingTree(false)
  }

  const connectRepoHandler = async () => {
    if (!repoUrl.trim()) return
    setConnecting(true)
    try {
      const r = await connectRepo(repoUrl)
      setRepo(r); localStorage.setItem('devflow_repo', JSON.stringify(r))
      setRepoUrl(''); showStatus(`✓ Connected: ${r.fullName}`)
    } catch(e) { showStatus('Error: ' + (e.response?.data?.error || e.message)) }
    setConnecting(false)
  }

  // Open file from GitHub tree
  const openGhFile = async (file) => {
    if (openTabs.find(t => t.path === file.path)) { setActiveTab(file.path); return }
    try {
      const { content, sha } = await getFile(repo.owner, repo.repo, file.path, repo.defaultBranch)
      addTab(file.path, content, sha, false)
    } catch(e) { showStatus('Error: ' + e.message) }
  }

  // Add tab helper
  const addTab = (path, content='', sha=null, isNew=true) => {
    setOpenTabs(prev => {
      if (prev.find(t => t.path === path)) { setActiveTab(path); return prev }
      return [...prev, { path, content, sha, unsaved: isNew, isNew }]
    })
    setActiveTab(path)
  }

  // Create new file/folder entry
  const createEntry = (name, parentFolder, type) => {
    if (!name?.trim()) return
    const path = parentFolder ? `${parentFolder}/${name}` : name
    if (type === 'folder') {
      addTab(`${path}/.gitkeep`, '', null, true)
    } else {
      addTab(path, '', null, true)
    }
    setAddingIn(null); setShowRootAdd(null)
    showStatus(`Created: ${path}`)
  }

  // Load template
  const loadTemplate = (templateName) => {
    const tpl = TEMPLATES[templateName]
    if (!tpl) return
    const newTabs = tpl.files.map(f => ({ path:f.path, content:f.content, sha:null, unsaved:true, isNew:true }))
    setOpenTabs(prev => {
      const existing = prev.filter(t => !newTabs.find(n => n.path === t.path))
      return [...existing, ...newTabs]
    })
    setActiveTab(newTabs[0].path)
    setShowTemplates(false)
    showStatus(`✓ ${templateName} template loaded — ${newTabs.length} files ready`)
  }

  // Editor change
  const handleEditorChange = (val) => {
    if (!activeTab) return
    setOpenTabs(prev => prev.map(t => t.path===activeTab ? {...t, content:val||'', unsaved:true} : t))
  }

  // Apply code from AI to current file
  const applyToEditor = (code) => {
    if (!activeTab) { showStatus('Open a file first, then apply code'); return }
    setOpenTabs(prev => prev.map(t => t.path===activeTab ? {...t, content:code, unsaved:true} : t))
    showStatus('✓ Code applied to ' + fileName)
    editorRef.current?.focus()
  }

  // Apply bug fix at cursor
  const applyBugFix = (fixCode) => {
    if (!activeTab || !fixCode) return
    const editor = editorRef.current
    if (editor) {
      const sel = editor.getSelection()
      editor.executeEdits('bug-fix', [{ range: sel, text: fixCode }])
      setOpenTabs(prev => prev.map(t => t.path===activeTab ? {...t, unsaved:true} : t))
      showStatus('✓ Bug fix applied to ' + fileName)
    }
  }

  // Save to GitHub
  const saveCurrentFile = async () => {
    if (!activeTabData || !repo || saving) return
    setSaving(true)
    try {
      const { sha } = await saveFile(repo.owner, repo.repo, activeTabData.path, activeTabData.content, activeTabData.sha, `Update ${activeTabData.path} via DevFlow AI`)
      setOpenTabs(prev => prev.map(t => t.path===activeTab ? {...t, sha, unsaved:false, isNew:false} : t))
      showStatus(`✓ Saved: ${activeTabData.path}`); loadTree()
    } catch(e) { showStatus('Save error: ' + (e.response?.data?.error || e.message)) }
    setSaving(false)
  }

  // Ctrl+S
  useEffect(() => {
    const h = e => { if ((e.ctrlKey||e.metaKey)&&e.key==='s') { e.preventDefault(); saveCurrentFile() } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [activeTabData, saving])

  // Close tab
  const closeTab = (e, path) => {
    e.stopPropagation()
    const tab = openTabs.find(t => t.path===path)
    if (tab?.unsaved && !window.confirm('Unsaved changes. Close anyway?')) return
    const remaining = openTabs.filter(t => t.path!==path)
    setOpenTabs(remaining)
    if (activeTab===path) setActiveTab(remaining[remaining.length-1]?.path || null)
  }

  // Push all to GitHub
  const pushAllToGitHub = async () => {
    const toSave = openTabs.filter(t => t.unsaved)
    if (!toSave.length) { showStatus('Nothing to push'); return }
    if (!repo) { showStatus('Connect a repo first'); return }
    setPushing(true); let saved=0, failed=0
    for (const tab of toSave) {
      try {
        const { sha } = await saveFile(repo.owner, repo.repo, tab.path, tab.content, tab.sha, tab.isNew?`Add ${tab.path} via DevFlow AI`:`Update ${tab.path} via DevFlow AI`)
        setOpenTabs(prev => prev.map(t => t.path===tab.path ? {...t, sha, unsaved:false, isNew:false} : t))
        saved++
      } catch(e) { failed++; console.error(tab.path, e.message) }
    }
    showStatus(`✓ Pushed ${saved} file${saved!==1?'s':''}${failed?` (${failed} failed)`:''}`)
    loadTree(); setPushing(false)
  }

  // Load boilerplate from CoPilot
  const loadBoilerplateFiles = (result) => {
    if (!result?.files?.length) return
    const newTabs = result.files
      .filter(f => f.path && f.content !== undefined)
      .map(f => ({ path:f.path, content:f.content, sha:null, unsaved:true, isNew:true }))
    if (newTabs.length) {
      setOpenTabs(prev => {
        const existing = prev.filter(t => !newTabs.find(n => n.path===t.path))
        return [...existing, ...newTabs]
      })
      setActiveTab(newTabs[0].path)
      showStatus(`✓ ${newTabs.length} files loaded — Push to GitHub when ready`)
    }
  }

  const disconnectRepo = () => {
    setRepo(null); setGhFiles([]); localStorage.removeItem('devflow_repo')
    showStatus('Disconnected')
  }

  const unsavedCount = openTabs.filter(t => t.unsaved).length
  const allFiles = [...ghFiles, ...openTabs.filter(t => t.isNew && !ghFiles.find(g => g.path===t.path)).map(t => ({ path:t.path }))]
  const tree = buildTree(allFiles)

  return (
    <div className="flex flex-col h-screen bg-canvas font-poppins overflow-hidden">

      {/* TOP BAR */}
      <header className="flex items-center gap-2 px-3 py-1.5 bg-default border-b border-border shrink-0 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{background:'linear-gradient(135deg,#238636,#1a7f37)',boxShadow:'0 0 10px rgba(63,185,80,0.35)'}}>
            <Zap size={14} color="#fff" fill="#fff"/>
          </div>
          <span className="font-bold text-sm tracking-tight hidden sm:block">DevFlow <span className="text-green">AI</span></span>
        </div>

        <div className="w-px h-5 bg-border mx-1 hidden sm:block"/>

        {/* Templates button */}
        <button onClick={() => setShowTemplates(v => !v)}
          className="btn-green text-xs py-1.5 shrink-0">
          <Plus size={12}/>New Project
        </button>

        {/* Repo connect */}
        {!repo ? (
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <input className="input-field text-xs py-1.5 flex-1"
              placeholder="GitHub repo URL (optional)"
              value={repoUrl} onChange={e=>setRepoUrl(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&connectRepoHandler()}/>
            <button onClick={connectRepoHandler} disabled={connecting||!repoUrl.trim()}
              className="btn-secondary text-xs py-1.5 shrink-0 disabled:opacity-40">
              {connecting?<Loader2 size={12} className="animate-spin"/>:<FolderGit2 size={12}/>}
              Connect
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green/10 border border-green/25">
              <Github size={11} className="text-green"/>
              <span className="text-xs font-medium text-green">{repo.fullName}</span>
            </div>
            <button onClick={loadTree} className="btn-ghost py-1 px-1.5" title="Refresh"><RefreshCw size={11}/></button>
            <button onClick={disconnectRepo} className="btn-ghost py-1 px-1.5 hover:text-red-400"><X size={11}/></button>
          </div>
        )}

        {/* Status */}
        {status && (
          <span className={`text-xs px-2 py-0.5 rounded-full border animate-fade-in shrink-0 hidden sm:block
            ${status.startsWith('✓') ? 'text-green bg-green/10 border-green/25'
            : status.startsWith('Error') ? 'text-red-400 bg-red-400/10 border-red-400/25'
            : 'text-fg-muted bg-subtle border-border'}`}>
            {status}
          </span>
        )}

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Preview toggle */}
          {hasHtml && (
            <button onClick={() => setShowPreview(v => !v)}
              className={`btn-secondary text-xs py-1.5 ${showPreview ? 'text-green border-green/40' : ''}`}
              title="Toggle live preview">
              {showPreview ? <EyeOff size={12}/> : <Eye size={12}/>}
              {showPreview ? 'Hide Preview' : 'Live Preview'}
            </button>
          )}

          {/* Save */}
          {activeTabData && (
            <button onClick={saveCurrentFile} disabled={saving||!activeTabData.unsaved||!repo}
              className="btn-secondary text-xs py-1.5 disabled:opacity-40" title={!repo?'Connect repo to save to GitHub':''}>
              {saving?<Loader2 size={12} className="animate-spin"/>:<Save size={12}/>}
              {saving?'Saving...':activeTabData.unsaved?'Save*':'Saved'}
            </button>
          )}

          {/* Push all */}
          {unsavedCount > 0 && repo && (
            <button onClick={pushAllToGitHub} disabled={pushing}
              className="btn-green text-xs py-1.5 disabled:opacity-40">
              {pushing?<Loader2 size={12} className="animate-spin"/>:<Upload size={12}/>}
              {pushing?'Pushing...':`Push ${unsavedCount}`}
            </button>
          )}

          {user && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-border">
              <img src={user.avatar} alt="" className="w-6 h-6 rounded-full border border-border"/>
            </div>
          )}
          <button onClick={onLogout} className="btn-ghost p-1.5 hover:text-red-400"><LogOut size={13}/></button>
        </div>
      </header>

      {/* Templates dropdown */}
      {showTemplates && (
        <div className="absolute top-12 left-3 z-50 w-72 bg-default border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 bg-subtle border-b border-border">
            <span className="text-sm font-semibold">New Project from Template</span>
            <button onClick={() => setShowTemplates(false)} className="btn-ghost p-0.5"><X size={13}/></button>
          </div>
          <div className="p-2">
            {Object.entries(TEMPLATES).map(([name, tpl]) => (
              <button key={name} onClick={() => loadTemplate(name)}
                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-subtle transition-all text-left">
                <span className="text-xl shrink-0">{tpl.icon}</span>
                <div>
                  <div className="text-sm font-medium text-fg-default">{name}</div>
                  <div className="text-xs text-fg-muted">{tpl.desc}</div>
                  <div className="text-[10px] text-fg-subtle mt-0.5">{tpl.files.length} files</div>
                </div>
              </button>
            ))}
            <div className="border-t border-border mt-2 pt-2 px-1">
              <p className="text-[10px] text-fg-subtle">
                💡 Or ask AI: "Generate a React todo app" in the Co-pilot panel
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* FILE TREE */}
        <div className="w-48 shrink-0 border-r border-border bg-default flex flex-col overflow-hidden">
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border">
            <span className="text-[10px] font-semibold text-fg-subtle uppercase tracking-wider flex-1">Files</span>
            {loadingTree && <Loader2 size={10} className="animate-spin text-fg-subtle"/>}
            <button onClick={() => setShowRootAdd('file')} className="p-0.5 rounded hover:bg-subtle text-fg-subtle hover:text-green" title="New file"><FilePlus size={12}/></button>
            <button onClick={() => setShowRootAdd('folder')} className="p-0.5 rounded hover:bg-subtle text-fg-subtle hover:text-blue-400" title="New folder"><FolderPlus size={12}/></button>
          </div>

          <div className="flex-1 overflow-y-auto py-0.5">
            {showRootAdd && (
              <InlineInput type={showRootAdd} depth={0}
                onConfirm={n => createEntry(n, '', showRootAdd)}
                onCancel={() => setShowRootAdd(null)}/>
            )}
            {allFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
                <Folder size={20} className="text-fg-subtle"/>
                <p className="text-[10px] text-fg-subtle leading-relaxed">Click "New Project" above to start, or connect a GitHub repo</p>
              </div>
            ) : (
              Object.entries(tree)
                .sort(([,a],[,b]) => (!!b.__file)-(!!a.__file))
                .map(([k, v]) => (
                  <TreeNode key={k} name={k} node={v} depth={0}
                    onFileClick={ghFiles.find(f=>f.path===k) ? openGhFile : (f) => { addTab(f.path, openTabs.find(t=>t.path===f.path)?.content||'') }}
                    activeFile={activeTab}
                    onAddFile={n => { setAddingIn({folder:n, type:'file'}); setShowRootAdd(null) }}
                    onAddFolder={n => { setAddingIn({folder:n, type:'folder'}); setShowRootAdd(null) }}
                    addingIn={addingIn}
                    onAddConfirm={(n, f) => createEntry(n, f, addingIn?.type)}
                    onAddCancel={() => setAddingIn(null)}/>
                ))
            )}
          </div>
        </div>

        {/* EDITOR AREA */}
        <div className={`flex flex-col overflow-hidden ${showPreview ? 'flex-1' : 'flex-1'}`}>
          {/* Tabs */}
          <div className="flex items-center bg-default border-b border-border overflow-x-auto shrink-0" style={{minHeight:34}}>
            {openTabs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-1.5 gap-3">
                <span className="text-xs text-fg-subtle">Create a project or open a file</span>
              </div>
            ) : openTabs.map(tab => (
              <div key={tab.path} onClick={() => setActiveTab(tab.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer border-r border-border group transition-all shrink-0 max-w-[180px]
                  ${activeTab===tab.path ? 'bg-canvas text-fg-default border-t-2 border-t-green' : 'text-fg-muted hover:text-fg-default hover:bg-subtle'}`}>
                {getFileIcon(tab.path, 9)}
                <span className="text-xs truncate">{tab.path.split('/').pop()}</span>
                {tab.unsaved && <span className="w-1.5 h-1.5 rounded-full bg-green shrink-0 animate-pulse-green"/>}
                <button onClick={e=>closeTab(e,tab.path)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 ml-0.5 shrink-0"><X size={10}/></button>
              </div>
            ))}
          </div>

          {/* Editor + Preview split */}
          <div className={`flex flex-1 overflow-hidden ${showPreview ? 'flex-row' : ''}`}>
            {/* Monaco */}
            <div className={`flex flex-col ${showPreview ? 'flex-1 border-r border-border' : 'flex-1'} overflow-hidden`}>
              {activeTab ? (
                <Editor height="100%" language={getLang(activeTab)} value={fileContent}
                  onChange={handleEditorChange} theme="vs-dark"
                  onMount={e => { editorRef.current = e }}
                  options={{
                    fontSize:13, fontFamily:"'JetBrains Mono',monospace",
                    minimap:{enabled:false}, scrollBeyondLastLine:false, wordWrap:'on',
                    lineNumbers:'on', padding:{top:10}, smoothScrolling:true,
                    cursorBlinking:'smooth', tabSize:2, renderLineHighlight:'all',
                    bracketPairColorization:{enabled:true},
                    suggest:{showKeywords:true},
                    quickSuggestions:true,
                  }}/>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8 bg-canvas">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{background:'linear-gradient(135deg,#238636,#1a7f37)',boxShadow:'0 0 28px rgba(63,185,80,0.3)'}}>
                    <Zap size={24} color="#fff" fill="#fff"/>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold mb-2">DevFlow AI Editor</h2>
                    <p className="text-xs text-fg-muted leading-relaxed">
                      Click <strong>"New Project"</strong> to start from a template<br/>
                      or connect a GitHub repo to edit existing files
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-xs text-left">
                    {Object.entries(TEMPLATES).slice(0,4).map(([n,t]) => (
                      <button key={n} onClick={() => loadTemplate(n)}
                        className="p-2.5 rounded-lg bg-subtle border border-border hover:border-green/40 transition-all text-left">
                        <div className="text-base mb-1">{t.icon}</div>
                        <div className="text-[10px] font-medium text-fg-muted">{n}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Preview */}
            {showPreview && (
              <div className="w-1/2 shrink-0 overflow-hidden">
                <LivePreview tabs={openTabs}/>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANELS */}
        <div className="flex border-l border-border shrink-0">
          <div className="w-10 flex flex-col items-center py-3 gap-1 bg-default">
            {PANELS.map(p => (
              <button key={p.id}
                onClick={() => { setActivePanel(p.id); setPanelOpen(prev => activePanel===p.id ? !prev : true) }}
                title={p.label}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${activePanel===p.id&&panelOpen ? `bg-subtle ${p.color}` : 'text-fg-subtle hover:bg-subtle hover:text-fg-default'}`}>
                {p.icon}
              </button>
            ))}
          </div>
          {panelOpen && (
            <div className="w-80 border-l border-border flex flex-col overflow-hidden bg-default">
              {activePanel==='agent'    && <AgentPanel fileContent={fileContent} fileName={fileName} filePath={activeTab} openTabs={openTabs} onFileUpdate={applyToEditor}/>}
              {activePanel==='copilot'  && <CoPilotPanel fileContent={fileContent} fileName={fileName} onLoadFiles={loadBoilerplateFiles} onCreateFile={n=>createEntry(n,'','file')} onApplyCode={applyToEditor}/>}
              {activePanel==='bugs'     && <BugScannerPanel fileContent={fileContent} fileName={fileName} onApplyFix={applyBugFix}/>}
              {activePanel==='deploy'   && <DeployPanel owner={repo?.owner} repo={repo?.repo} branch={repo?.defaultBranch}/>}
              {activePanel==='pr'       && <PRReviewPanel owner={repo?.owner} repo={repo?.repo}/>}
              {activePanel==='terminal' && <TerminalPanel token={localStorage.getItem('devflow_token')}/>}
            </div>
          )}
        </div>
      </div>

      {/* STATUS BAR */}
      <div className="flex items-center px-3 h-5 border-t border-border text-[10px] text-white shrink-0" style={{background:'#238636'}}>
        <span className="font-semibold mr-2">DevFlow AI</span>
        {repo && <span className="opacity-75 mr-2">{repo.fullName}</span>}
        {activeTab && <span className="opacity-75 truncate max-w-48">{activeTab}</span>}
        {activeTabData?.unsaved && <span className="ml-2 text-yellow-300">● unsaved</span>}
        {!repo && unsavedCount > 0 && <span className="ml-2 text-yellow-300">● {unsavedCount} local files (connect repo to push)</span>}
        {hasHtml && !showPreview && (
          <button onClick={() => setShowPreview(true)} className="ml-3 flex items-center gap-1 opacity-75 hover:opacity-100">
            <Play size={9}/> Preview
          </button>
        )}
        {unsavedCount > 0 && repo && (
          <button onClick={pushAllToGitHub} disabled={pushing}
            className="ml-3 flex items-center gap-1 opacity-75 hover:opacity-100">
            <Upload size={9}/> Push {unsavedCount}
          </button>
        )}
        <span className="ml-auto opacity-70">{getLang(activeTab)}</span>
      </div>
    </div>
  )
}
