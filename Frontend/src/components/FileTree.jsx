import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react'

const EXT_COLORS = {
  js:'#f0db4f', jsx:'#61dafb', ts:'#3178c6', tsx:'#61dafb',
  json:'#cbcb41', md:'#519aba', css:'#563d7c', html:'#e34c26',
  py:'#3572A5', env:'#8b949e', yml:'#cb171e', yaml:'#cb171e',
  sh:'#4eaa25', txt:'#8b949e', gitignore:'#f54d27'
}

function getExt(path) { return path.split('.').pop().toLowerCase() }
function getColor(path) { return EXT_COLORS[getExt(path)] || '#8b949e' }

function buildTree(files) {
  const root = {}
  files.forEach(f => {
    const parts = f.path.split('/')
    let cur = root
    parts.forEach((p, i) => {
      if (!cur[p]) cur[p] = i === parts.length - 1 ? { __file: f } : {}
      cur = cur[p]
    })
  })
  return root
}

function TreeNode({ name, node, depth = 0, onSelect, activeFile }) {
  const isFile = !!node.__file
  const [open, setOpen] = useState(depth < 2)
  const pad = depth * 12 + 8

  if (isFile) {
    const active = activeFile === node.__file.path
    return (
      <div
        onClick={() => onSelect(node.__file)}
        className={`flex items-center gap-1.5 py-0.5 cursor-pointer rounded-sm text-xs transition-all select-none
          ${active ? 'bg-green/10 text-green' : 'text-fg-muted hover:text-fg-default hover:bg-white/5'}`}
        style={{ paddingLeft: pad }}
      >
        <span style={{ color: active ? '#3fb950' : getColor(name), fontSize: 10 }}>●</span>
        <span className="truncate font-mono">{name}</span>
      </div>
    )
  }

  const keys = Object.keys(node).sort((a, b) => {
    const aDir = !node[a].__file && Object.keys(node[a]).some(k => !node[a][k].__file)
    const bDir = !node[b].__file && Object.keys(node[b]).some(k => !node[b][k].__file)
    return bDir - aDir || a.localeCompare(b)
  })

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 py-0.5 cursor-pointer rounded-sm text-xs text-fg-muted hover:text-fg-default hover:bg-white/5 transition-all select-none"
        style={{ paddingLeft: pad }}
      >
        {open
          ? <><ChevronDown size={11} className="shrink-0 text-fg-subtle"/><FolderOpen size={11} className="shrink-0 text-yellow-400"/></>
          : <><ChevronRight size={11} className="shrink-0 text-fg-subtle"/><Folder size={11} className="shrink-0 text-yellow-400"/></>}
        <span className="font-mono truncate">{name}</span>
      </div>
      {open && keys.map(k => (
        <TreeNode key={k} name={k} node={node[k]} depth={depth + 1} onSelect={onSelect} activeFile={activeFile} />
      ))}
    </div>
  )
}

export default function FileTree({ files, onSelect, activeFile }) {
  const [search, setSearch] = useState('')
  const filtered = search ? files.filter(f => f.path.toLowerCase().includes(search.toLowerCase())) : null
  const tree = buildTree(files)
  const roots = Object.keys(tree)

  return (
    <div className="flex flex-col h-full bg-default border-r border-border">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Explorer</span>
        <span className="text-xs text-fg-subtle">{files.length} files</span>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-border">
        <input
          className="input-field text-xs py-1"
          placeholder="Search files..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tree / Search results */}
      <div className="flex-1 overflow-y-auto py-1 min-h-0">
        {filtered
          ? filtered.map(f => (
              <div
                key={f.path}
                onClick={() => onSelect(f)}
                className={`flex items-center gap-1.5 px-3 py-0.5 cursor-pointer text-xs transition-all truncate font-mono
                  ${activeFile === f.path ? 'bg-green/10 text-green' : 'text-fg-muted hover:text-fg-default hover:bg-white/5'}`}
              >
                <span style={{ color: getColor(f.path), fontSize: 9 }}>●</span>
                <span className="truncate">{f.path}</span>
              </div>
            ))
          : roots.map(k => (
              <TreeNode key={k} name={k} node={tree[k]} depth={0} onSelect={onSelect} activeFile={activeFile} />
            ))
        }
      </div>
    </div>
  )
}
