import { useState, useEffect, useRef } from 'react'
import {
  Rocket, Loader2, RefreshCw, CheckCircle, XCircle,
  Clock, AlertTriangle, ExternalLink, Zap, ChevronDown, ChevronRight, Copy
} from 'lucide-react'
import { triggerDeploy, getPipelineStatus, getRunLogs } from '../../utils/api'

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  return `${Math.floor(s/3600)}h ago`
}

const STATUS = {
  success:     { icon: <CheckCircle size={13} className="text-green"/>,         label:'Success',    badge:'badge-green' },
  completed:   { icon: <CheckCircle size={13} className="text-green"/>,         label:'Success',    badge:'badge-green' },
  failure:     { icon: <XCircle size={13} className="text-red-400"/>,           label:'Failed',     badge:'badge-red'   },
  in_progress: { icon: <Loader2 size={13} className="text-yellow-400 animate-spin"/>, label:'Running', badge:'badge-yellow' },
  queued:      { icon: <Clock size={13} className="text-fg-muted"/>,            label:'Queued',     badge:'badge-blue'  },
  cancelled:   { icon: <XCircle size={13} className="text-fg-subtle"/>,         label:'Cancelled',  badge:'badge-blue'  },
}

export default function DeployPanel({ owner, repo, branch = 'main' }) {
  const [runs, setRuns]           = useState([])
  const [loading, setLoading]     = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deployMsg, setDeployMsg] = useState('')
  const [selectedRun, setSelectedRun] = useState(null)
  const [logs, setLogs]           = useState(null)
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsOpen, setLogsOpen]   = useState(false)
  const pollRef = useRef(null)

  const fetchStatus = async () => {
    if (!owner || !repo) return
    try {
      const { runs: r } = await getPipelineStatus(owner, repo)
      setRuns(r || [])
    } catch {}
  }

  useEffect(() => {
    if (!owner || !repo) return
    fetchStatus()
    pollRef.current = setInterval(fetchStatus, 8000)
    return () => clearInterval(pollRef.current)
  }, [owner, repo])

  const deploy = async () => {
    if (!owner || !repo) return
    setDeploying(true); setDeployMsg('')
    try {
      const result = await triggerDeploy(owner, repo, branch)
      setDeployMsg(result.message || 'Pipeline triggered!')
      setTimeout(fetchStatus, 3000)
    } catch (e) {
      setDeployMsg('Error: ' + (e.response?.data?.error || e.message))
    }
    setDeploying(false)
  }

  const viewLogs = async (run) => {
    setSelectedRun(run); setLogs(null); setLogsLoading(true); setLogsOpen(true)
    try {
      const data = await getRunLogs(owner, repo, run.id)
      setLogs(data)
    } catch (e) {
      setLogs({ error: e.response?.data?.error || e.message })
    }
    setLogsLoading(false)
  }

  if (!owner || !repo) return (
    <div className="flex flex-col h-full bg-default">
      <div className="panel-header">
        <Rocket size={14} className="text-blue-400"/>
        <span className="panel-title">Deployment</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-xs text-fg-subtle">Connect a GitHub repo to view pipeline status.</p>
      </div>
    </div>
  )

  const latestRun = runs[0]
  const statusCfg = STATUS[latestRun?.conclusion || latestRun?.status] || STATUS.queued

  return (
    <div className="flex flex-col h-full bg-default">
      <div className="panel-header">
        <Rocket size={14} className="text-blue-400"/>
        <span className="panel-title">Deployment</span>
        <button onClick={fetchStatus} className="ml-auto btn-ghost p-1" title="Refresh">
          <RefreshCw size={11}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* Repo + Deploy button */}
        <div className="p-3 rounded-xl bg-subtle border border-border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs font-semibold text-fg-default">{owner}/{repo}</div>
              <div className="text-[10px] text-fg-subtle">branch: {branch}</div>
            </div>
            {latestRun && (
              <div className="flex items-center gap-1.5">
                {statusCfg.icon}
                <span className={statusCfg.badge + ' text-[10px]'}>{statusCfg.label}</span>
              </div>
            )}
          </div>
          <button onClick={deploy} disabled={deploying}
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{background:'rgba(88,166,255,0.15)',color:'#58a6ff',border:'1px solid rgba(88,166,255,0.35)',boxShadow:'0 0 14px rgba(88,166,255,0.15)'}}>
            {deploying
              ? <><Loader2 size={13} className="animate-spin"/>Triggering...</>
              : <><Zap size={13} fill="currentColor"/>Deploy to {branch}</>}
          </button>
          {deployMsg && (
            <p className={`text-xs mt-2 ${deployMsg.startsWith('Error') ? 'text-red-400' : 'text-green'}`}>
              {deployMsg}
            </p>
          )}
        </div>

        {/* Latest run summary */}
        {latestRun && (
          <div
            className={`p-3 rounded-xl border cursor-pointer transition-all
              ${latestRun.conclusion === 'failure'
                ? 'bg-red-400/8 border-red-400/25 hover:border-red-400/40'
                : latestRun.conclusion === 'success' || latestRun.conclusion === 'completed'
                ? 'bg-green/8 border-green/25 hover:border-green/40'
                : 'bg-yellow-400/8 border-yellow-400/20 hover:border-yellow-400/35'}`}
            onClick={() => viewLogs(latestRun)}>
            <div className="flex items-center gap-2 mb-1">
              {statusCfg.icon}
              <span className="text-sm font-semibold text-fg-default flex-1 truncate">{latestRun.name}</span>
              <ExternalLink size={11} className="text-fg-muted hover:text-green shrink-0"
                onClick={e => { e.stopPropagation(); window.open(latestRun.url, '_blank') }}/>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-fg-subtle">
              <span>by {latestRun.actor}</span>
              <span>·</span>
              <span>{timeAgo(latestRun.createdAt)}</span>
            </div>

            {/* Problem 6: Success message */}
            {(latestRun.conclusion === 'success' || latestRun.conclusion === 'completed') && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-green">
                <CheckCircle size={11}/>
                Pipeline passed! Click to see logs.
              </div>
            )}

            {/* Problem 6: Failure summary */}
            {latestRun.conclusion === 'failure' && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                <AlertTriangle size={11}/>
                Pipeline failed. Click to see AI diagnosis.
              </div>
            )}

            {latestRun.status === 'in_progress' && (
              <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin"/>
                Running... auto-refreshing every 8s
              </div>
            )}
          </div>
        )}

        {/* Logs + AI Diagnosis panel */}
        {selectedRun && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-subtle border-b border-border cursor-pointer"
              onClick={() => setLogsOpen(o => !o)}>
              <div className="flex items-center gap-2">
                {logsLoading ? <Loader2 size={12} className="animate-spin text-green"/> : (STATUS[selectedRun.conclusion || selectedRun.status]?.icon)}
                <span className="text-xs font-semibold text-fg-default truncate">{selectedRun.name}</span>
              </div>
              {logsOpen ? <ChevronDown size={11} className="text-fg-subtle"/> : <ChevronRight size={11} className="text-fg-subtle"/>}
            </div>

            {logsOpen && (
              <div className="p-3 space-y-3">
                {logsLoading && (
                  <div className="flex items-center gap-2 py-3 text-xs text-fg-muted">
                    <Loader2 size={12} className="animate-spin text-green"/>Fetching logs...
                  </div>
                )}

                {logs?.error && (
                  <div className="p-2 rounded bg-red-400/10 border border-red-400/25 text-xs text-red-400">
                    {logs.error}
                  </div>
                )}

                {/* Problem 6: AI Diagnosis on failure */}
                {logs?.aiExplanation && (
                  <div className="p-3 rounded-lg bg-red-400/8 border border-red-400/25 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={13} className="text-red-400 shrink-0"/>
                      <span className="text-sm font-semibold text-red-400">AI Diagnosis</span>
                    </div>

                    <div className="text-xs font-medium text-fg-muted">
                      Error Type: <span className="text-red-400">{logs.aiExplanation.errorType}</span>
                    </div>

                    <p className="text-xs text-fg-muted leading-relaxed">
                      {logs.aiExplanation.explanation}
                    </p>

                    {logs.aiExplanation.fixSteps?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-fg-subtle uppercase mb-1.5">Fix Steps</p>
                        {logs.aiExplanation.fixSteps.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 mb-1 text-xs text-fg-muted">
                            <span className="text-green font-bold shrink-0">{i+1}.</span>
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Problem 6: Fix command button */}
                    {logs.aiExplanation.fixCode && (
                      <div className="mt-2">
                        <p className="text-[10px] font-semibold text-fg-subtle uppercase mb-1.5">Fix Command</p>
                        <div className="flex items-center gap-2 p-2 rounded bg-canvas border border-border">
                          <code className="text-xs font-mono text-green flex-1 break-all">{logs.aiExplanation.fixCode}</code>
                          <button
                            onClick={() => navigator.clipboard.writeText(logs.aiExplanation.fixCode)}
                            className="shrink-0 p-1 rounded hover:bg-subtle text-fg-subtle hover:text-green transition-all"
                            title="Copy fix command">
                            <Copy size={11}/>
                          </button>
                        </div>
                        <p className="text-[10px] text-fg-subtle mt-1">Copy and run in your local terminal</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Problem 6: Success state */}
                {logs && !logs.error && !logs.aiExplanation && logs.status !== 'failure' && (
                  <div className="p-3 rounded-lg bg-green/8 border border-green/25 flex items-start gap-2">
                    <CheckCircle size={14} className="text-green shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-sm font-semibold text-green">Pipeline Passed!</p>
                      <p className="text-xs text-fg-muted mt-0.5">All steps completed successfully. Your code has been deployed.</p>
                    </div>
                  </div>
                )}

                {/* Raw logs */}
                {logs?.logs && (
                  <div>
                    <p className="text-[10px] font-semibold text-fg-subtle uppercase tracking-wider mb-1.5">Raw Logs</p>
                    <pre className="p-2.5 rounded-lg bg-canvas border border-border text-[10px] font-mono text-fg-muted leading-relaxed overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {logs.logs}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* All runs */}
        {runs.length > 1 && (
          <div>
            <p className="text-[10px] font-semibold text-fg-subtle uppercase tracking-wider mb-2">Recent Runs</p>
            <div className="space-y-1.5">
              {runs.slice(1).map(r => {
                const cfg = STATUS[r.conclusion || r.status] || STATUS.queued
                return (
                  <div key={r.id} onClick={() => viewLogs(r)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-subtle border border-border hover:border-border cursor-pointer transition-all">
                    {cfg.icon}
                    <span className="text-xs text-fg-muted flex-1 truncate">{r.name}</span>
                    <span className="text-[10px] text-fg-subtle">{timeAgo(r.createdAt)}</span>
                    <span className={cfg.badge + ' text-[9px]'}>{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {runs.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Rocket size={28} className="text-fg-subtle mb-3"/>
            <p className="text-xs text-fg-subtle">No pipeline runs yet</p>
            <p className="text-[10px] text-fg-subtle mt-1">Click "Deploy" above to trigger your first pipeline</p>
          </div>
        )}
      </div>
    </div>
  )
}
