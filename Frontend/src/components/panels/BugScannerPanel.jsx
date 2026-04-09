import { useState } from 'react'
import { Shield, Scan, AlertTriangle, AlertCircle, Info, CheckCircle, ChevronDown, ChevronRight, Wand2, Loader2 } from 'lucide-react'
import { scanCode } from '../../utils/api'

const SEV = {
  critical: { cls:'text-red-400',   bg:'bg-red-400/10 border-red-400/25',   icon:<AlertCircle size={12} className="text-red-400 shrink-0"/> },
  warning:  { cls:'text-yellow-400',bg:'bg-yellow-400/10 border-yellow-400/25',icon:<AlertTriangle size={12} className="text-yellow-400 shrink-0"/> },
  info:     { cls:'text-blue-400',  bg:'bg-blue-400/10 border-blue-400/25',  icon:<Info size={12} className="text-blue-400 shrink-0"/> },
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 28, c = 2 * Math.PI * r
  const col = score >= 70 ? '#3fb950' : score >= 40 ? '#d29922' : '#f85149'
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#21262d" strokeWidth="6"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke={col} strokeWidth="6"
          strokeDasharray={`${(score/100)*c} ${c}`} strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 5px ${col}80)`, transition:'stroke-dasharray .6s ease' }}/>
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-bold leading-none" style={{color:col}}>{score}</div>
        <div className="text-[9px] text-fg-subtle">score</div>
      </div>
    </div>
  )
}

// ── Bug item with Problem 4: Fix button ──────────────────────────────────────
function BugItem({ bug, fileContent, onApplyFix }) {
  const [open, setOpen] = useState(false)
  const [applying, setApplying] = useState(false)
  const s = SEV[bug.severity] || SEV.info

  // Problem 4: Smart fix — replace the buggy line with the fix
  const applyFix = async () => {
    if (!bug.fix || !onApplyFix) return
    setApplying(true)

    // Try to find the exact line in content and replace it
    const lines = (fileContent || '').split('\n')
    const lineIdx = (bug.line || 1) - 1

    if (lineIdx >= 0 && lineIdx < lines.length) {
      // Replace that specific line with the fix
      const newLines = [...lines]
      newLines[lineIdx] = bug.fix
      onApplyFix(newLines.join('\n'), bug)
    } else {
      // Fallback: just insert fix as comment + code at line
      onApplyFix(null, bug)
    }

    setTimeout(() => setApplying(false), 500)
  }

  return (
    <div className={`rounded-lg border text-xs ${s.bg}`}>
      <div className="flex items-center gap-2 p-2.5 cursor-pointer" onClick={() => setOpen(o=>!o)}>
        {s.icon}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-fg-default">{bug.type || 'Issue'}</span>
          <span className="text-fg-subtle ml-2">Line {bug.line}</span>
        </div>
        {/* Problem 4: Fix button */}
        {bug.fix && onApplyFix && (
          <button
            onClick={e => { e.stopPropagation(); applyFix() }}
            disabled={applying}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium shrink-0 transition-all disabled:opacity-50"
            style={{background:'rgba(63,185,80,0.15)',color:'#3fb950',border:'1px solid rgba(63,185,80,0.3)'}}>
            {applying ? <Loader2 size={9} className="animate-spin"/> : <Wand2 size={9}/>}
            Fix
          </button>
        )}
        {open ? <ChevronDown size={11} className="text-fg-subtle shrink-0"/> : <ChevronRight size={11} className="text-fg-subtle shrink-0"/>}
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2 animate-fade-in border-t border-white/5 pt-2">
          <p className="text-fg-muted leading-relaxed">{bug.message}</p>
          {bug.fix && (
            <div className="rounded-lg bg-canvas border border-border p-2">
              <div className="text-[10px] text-green mb-1 font-semibold">Suggested fix:</div>
              <code className="text-green font-mono text-[11px] whitespace-pre-wrap break-all">{bug.fix}</code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BugScannerPanel({ fileContent, fileName, onApplyFix }) {
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const runScan = async () => {
    if (!fileContent) return setError('Open a file in the editor first')
    setLoading(true); setError(''); setResult(null)
    try   { setResult(await scanCode(fileContent, fileName)) }
    catch(e) { setError(e.response?.data?.error || e.message) }
    setLoading(false)
  }

  // Problem 4: apply fix to editor content
  const handleApplyFix = (newContent, bug) => {
    if (!onApplyFix) return
    if (newContent) {
      onApplyFix(newContent)
    } else {
      // Could not pinpoint line — show alert with fix
      alert(`Fix for line ${bug.line}:\n\n${bug.fix}`)
    }
  }

  return (
    <div className="flex flex-col h-full bg-default">
      <div className="panel-header">
        <Shield size={14} className="text-red-400"/>
        <span className="panel-title">Bug Scanner</span>
        {result && (
          <span className="ml-auto text-[10px] text-fg-subtle">
            {result.bugs?.length || 0} issue{result.bugs?.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Scan button */}
        <button onClick={runScan} disabled={loading || !fileContent}
          className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          style={{background:'rgba(248,81,73,0.12)',color:'#f85149',border:'1px solid rgba(248,81,73,0.3)'}}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow='0 0 16px rgba(248,81,73,0.25)' }}
          onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
          {loading
            ? <><Loader2 size={14} className="animate-spin"/>Scanning...</>
            : <><Scan size={14}/>Scan: {fileName || 'Open a file first'}</>}
        </button>

        {!fileContent && !error && (
          <div className="text-center py-8">
            <Shield size={28} className="text-fg-subtle mx-auto mb-2"/>
            <p className="text-sm text-fg-muted">Open a file in the editor to scan it</p>
          </div>
        )}

        {error && <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/25 text-xs text-red-400">{error}</div>}

        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Score + summary */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-subtle border border-border">
              <ScoreRing score={result.score}/>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-fg-default mb-1.5">{result.summary}</div>
                <div className="flex gap-2 flex-wrap">
                  {result.bugs?.filter(b=>b.severity==='critical').length > 0 && (
                    <span className="badge-red">{result.bugs.filter(b=>b.severity==='critical').length} critical</span>
                  )}
                  {result.bugs?.filter(b=>b.severity==='warning').length > 0 && (
                    <span className="badge-yellow">{result.bugs.filter(b=>b.severity==='warning').length} warning</span>
                  )}
                  {result.bugs?.filter(b=>b.severity==='info').length > 0 && (
                    <span className="badge-blue">{result.bugs.filter(b=>b.severity==='info').length} info</span>
                  )}
                  {(!result.bugs || result.bugs.length === 0) && (
                    <span className="badge-green"><CheckCircle size={10}/>No bugs found!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bug list — each has Fix button (Problem 4) */}
            {result.bugs?.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-semibold text-fg-subtle uppercase tracking-wider flex items-center gap-2">
                  Issues
                  <span className="text-fg-subtle font-normal normal-case tracking-normal">— click Fix to auto-update editor</span>
                </div>
                {result.bugs.map((bug, i) => (
                  <BugItem key={i} bug={bug} fileContent={fileContent} onApplyFix={handleApplyFix}/>
                ))}
              </div>
            )}

            {/* Security */}
            {result.security?.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-fg-subtle uppercase tracking-wider mb-2">Security</div>
                {result.security.map((s, i) => (
                  <div key={i} className="flex gap-2 p-2 rounded bg-red-400/8 border border-red-400/20 mb-1.5 text-xs text-fg-muted">
                    <AlertCircle size={11} className="text-red-400 shrink-0 mt-0.5"/>{s}
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions?.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-fg-subtle uppercase tracking-wider mb-2">Suggestions</div>
                {result.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2 p-2 rounded bg-blue-400/8 border border-blue-400/20 mb-1.5 text-xs text-fg-muted">
                    <CheckCircle size={11} className="text-blue-400 shrink-0 mt-0.5"/>{s}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
