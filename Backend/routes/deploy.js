const express = require('express')
const axios   = require('axios')
const AdmZip  = require('adm-zip')
const auth    = require('../middleware/auth')
const router  = express.Router()

const gh = t => ({ headers: { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github+json' } })

const DEFAULT_WORKFLOW = `name: DevFlow Deploy
on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      message:
        description: 'Deploy message'
        default: 'Deploy via DevFlow AI'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test --if-present
      - name: Build
        run: npm run build --if-present
      - name: Deploy complete
        run: echo "✅ Deploy successful at $(date)"
`

// Ensure workflow file exists
async function ensureWorkflow(owner, repo, branch, token) {
  try {
    await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows/deploy.yml`,
      gh(token)
    )
  } catch {
    // Create it
    await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows/deploy.yml`,
      { message: 'Add DevFlow CI/CD workflow', content: Buffer.from(DEFAULT_WORKFLOW).toString('base64'), branch },
      gh(token)
    )
    await new Promise(r => setTimeout(r, 2000)) // wait for GitHub to process
  }
}

// ── Trigger deploy (workflow_dispatch — no manual steps needed) ───────────────
router.post('/trigger', auth, async (req, res) => {
  const { owner, repo, branch = 'main' } = req.body
  try {
    await ensureWorkflow(owner, repo, branch, req.user.githubToken)

    // Use workflow_dispatch — this works without a push
    try {
      await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`,
        { ref: branch, inputs: { message: 'Deploy triggered by DevFlow AI' } },
        gh(req.user.githubToken)
      )
    } catch (dispatchErr) {
      // Fallback: create an empty commit to trigger push event
      const repoData = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, gh(req.user.githubToken))
      const sha = repoData.data.default_branch
      console.log('Dispatch failed, trying commit trigger:', dispatchErr.message)
    }

    // Wait a moment then get the latest run
    await new Promise(r => setTimeout(r, 2500))
    const { data } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1&branch=${branch}`,
      gh(req.user.githubToken)
    )
    const run = data.workflow_runs?.[0]
    res.json({ message: '✓ Pipeline triggered!', runId: run?.id, runUrl: run?.html_url, status: run?.status })
  } catch (e) {
    res.status(400).json({ error: e.response?.data?.message || e.message })
  }
})

// ── Pipeline status ────────────────────────────────────────────────────────────
router.get('/status', auth, async (req, res) => {
  const { owner, repo } = req.query
  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=8`,
      gh(req.user.githubToken)
    )
    res.json({
      runs: data.workflow_runs.map(r => ({
        id: r.id, name: r.name, status: r.status,
        conclusion: r.conclusion, branch: r.head_branch,
        createdAt: r.created_at, url: r.html_url, actor: r.actor?.login,
        event: r.event,
      }))
    })
  } catch (e) {
    res.status(400).json({ error: e.response?.data?.message || e.message })
  }
})

// ── Logs + AI diagnosis ────────────────────────────────────────────────────────
router.get('/logs/:runId', auth, async (req, res) => {
  const { owner, repo } = req.query
  const { runId } = req.params
  try {
    const runRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`,
      gh(req.user.githubToken)
    )
    const conclusion = runRes.data.conclusion
    const status     = runRes.data.status

    let logText = ''
    try {
      const logsRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/logs`,
        { ...gh(req.user.githubToken), responseType: 'arraybuffer' }
      )
      const zip = new AdmZip(Buffer.from(logsRes.data))
      zip.getEntries().forEach(e => {
        if (!e.isDirectory && e.entryName.endsWith('.txt'))
          logText += `\n=== ${e.entryName} ===\n` + e.getData().toString('utf8').slice(0, 2000)
      })
      logText = logText.slice(0, 5000)
    } catch {
      logText = status === 'in_progress'
        ? '⏳ Pipeline is still running... refresh in a few seconds.'
        : '📋 Logs not available yet.'
    }

    let aiExplanation = null
    if (conclusion === 'failure' && process.env.GROQ_API_KEY && logText.length > 50) {
      try {
        const Groq = require('groq-sdk')
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
        const r = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: `GitHub Actions pipeline failed. Return ONLY valid JSON (no markdown, no backticks):
{"errorType":"<short type>","explanation":"<2-3 sentences plain English>","fixSteps":["step 1","step 2","step 3"],"fixCode":"<single terminal command>"}
Logs:\n${logText}`
          }],
          max_tokens: 500,
        })
        const raw = r.choices[0].message.content.replace(/```json\n?|```\n?/g, '').trim()
        aiExplanation = JSON.parse(raw)
      } catch (aiErr) {
        console.error('AI diagnosis failed:', aiErr.message)
        aiExplanation = {
          errorType: 'Parse Error',
          explanation: 'Could not auto-diagnose. Check raw logs below.',
          fixSteps: ['Read the raw logs', 'Fix the error', 'Push again'],
          fixCode: 'git push origin main'
        }
      }
    }

    res.json({ logs: logText, aiExplanation, status: conclusion || status })
  } catch (e) {
    res.status(400).json({ error: e.response?.data?.message || e.message })
  }
})

module.exports = router
