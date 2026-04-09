// ── DevFlow AI — ai.js (Groq — AI Agent mode) ────────────────────────────────
// FREE KEY: https://console.groq.com → API Keys
// Free limits: llama-3.3-70b: 30 req/min, ~1000/day | llama-3.1-8b: 30 req/min, 14400/day
const express = require('express')
const auth    = require('../middleware/auth')
const router  = express.Router()

function groq() {
  const Groq = require('groq-sdk')
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

async function ask(prompt, model = 'llama-3.3-70b-versatile', maxTokens = 2048) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY missing — get free key at console.groq.com')
  const r = await groq().chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
  })
  return r.choices[0].message.content
}

// ── AI AGENT — Write/edit file directly ──────────────────────────────────────
// This is the VS Code Copilot style — AI rewrites the whole file
router.post('/agent', auth, async (req, res) => {
  const { instruction, fileContent, fileName, filePath, allFiles } = req.body
  if (!instruction) return res.status(400).json({ error: 'Instruction required' })

  try {
    const fileCtx = fileContent
      ? `Current file (${fileName}):\n\`\`\`${filePath?.split('.').pop() || ''}\n${fileContent.slice(0, 3000)}\n\`\`\``
      : ''
    const otherFiles = allFiles?.length
      ? `\nOther open files: ${allFiles.map(f => f.path).join(', ')}`
      : ''

    const prompt = `You are an expert AI coding agent — like GitHub Copilot.
Your job: follow the instruction and return the COMPLETE updated file content.

Rules:
- Return ONLY the raw file code — no explanation, no markdown fences, no preamble
- Write the ENTIRE file from top to bottom — not just the changed part
- Follow best practices for the language
- Keep existing code that doesn't need to change
- Add comments only where helpful

${fileCtx}${otherFiles}

Instruction: ${instruction}

Now write the complete updated file:`

    const result = await ask(prompt, 'llama-3.3-70b-versatile', 3000)

    // Strip markdown fences if model adds them
    const code = result
      .replace(/^```[\w]*\n?/, '')
      .replace(/\n?```$/, '')
      .trim()

    res.json({ code, fileName, filePath })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── AI CHAT ────────────────────────────────────────────────────────────────────
router.post('/chat', auth, async (req, res) => {
  const { message, fileContent, fileName } = req.body
  if (!message) return res.status(400).json({ error: 'Message required' })
  if (!process.env.GROQ_API_KEY) return res.json({ reply: 'Add GROQ_API_KEY to .env — get free key at console.groq.com' })
  try {
    const prompt = `You are DevFlow AI — expert developer assistant inside a browser code editor.
Be concise. Give working code examples.
${fileContent ? `\nCurrent file (${fileName}):\n\`\`\`\n${fileContent.slice(0, 3000)}\n\`\`\`` : ''}
Question: ${message}`
    res.json({ reply: await ask(prompt, 'llama-3.3-70b-versatile', 1500) })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── BUG SCANNER ────────────────────────────────────────────────────────────────
router.post('/scan', auth, async (req, res) => {
  const { code, fileName = 'file' } = req.body
  if (!code) return res.status(400).json({ error: 'Code required' })
  if (!process.env.GROQ_API_KEY) return res.json({ score:75, summary:'Add GROQ_API_KEY', bugs:[], security:[], suggestions:[] })
  try {
    const prompt = `Senior code security expert. Analyze this code.
Return ONLY valid JSON (no markdown):
{"score":<0-100>,"summary":"<one line>","bugs":[{"line":<n>,"severity":"critical|warning|info","type":"<type>","message":"<plain English>","fix":"<exact fix code>"}],"security":["<issue>"],"suggestions":["<tip>"]}
File: ${fileName}\nCode:\n${code}`
    const raw = await ask(prompt, 'llama-3.3-70b-versatile', 1200)
    res.json(JSON.parse(raw.replace(/```json\n?|```\n?/g, '').trim()))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── BOILERPLATE ─────────────────────────────────────────────────────────────────
router.post('/boilerplate', auth, async (req, res) => {
  const { description } = req.body
  if (!description) return res.status(400).json({ error: 'Description required' })
  if (!process.env.GROQ_API_KEY) return res.json({ projectName:'my-project', files:[], setupInstructions:[] })
  try {
    const prompt = `Generate a complete production-ready project for: "${description}"
Return ONLY valid JSON (no markdown):
{"projectName":"<n>","description":"<what it does>","files":[{"path":"server.js","content":"<full content>"},{"path":"package.json","content":"<full json>"},...],"setupInstructions":["npm install","npm start"]}
Include: package.json, main file, routes if needed, .env.example, README.md
REAL WORKING CODE — no placeholders.`
    const raw = await ask(prompt, 'llama-3.3-70b-versatile', 3000)
    res.json(JSON.parse(raw.replace(/```json\n?|```\n?/g, '').trim()))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
