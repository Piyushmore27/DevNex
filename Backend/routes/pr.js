const express = require('express');
const axios   = require('axios');
const auth    = require('../middleware/auth');
const router  = express.Router();

const gh = (t) => ({ headers: { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github+json' } });

// List open PRs
router.get('/list', auth, async (req, res) => {
  const { owner, repo } = req.query;
  try {
    const { data } = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=20`, gh(req.user.githubToken));
    res.json({ prs: data.map(p => ({ number:p.number, title:p.title, state:p.state, author:p.user.login, branch:p.head.ref, createdAt:p.created_at, url:p.html_url, additions:p.additions, deletions:p.deletions, mergeable:p.mergeable })) });
  } catch (e) { res.status(400).json({ error: e.response?.data?.message || e.message }); }
});

// Get PR diff
router.get('/diff/:prNumber', auth, async (req, res) => {
  const { owner, repo } = req.query;
  const { prNumber } = req.params;
  try {
    const [filesRes, prRes] = await Promise.all([
      axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`, gh(req.user.githubToken)),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, gh(req.user.githubToken))
    ]);
    res.json({
      prInfo: { title:prRes.data.title, author:prRes.data.user.login, branch:prRes.data.head.ref, url:prRes.data.html_url, mergeable:prRes.data.mergeable },
      files: filesRes.data.map(f => ({ filename:f.filename, status:f.status, additions:f.additions, deletions:f.deletions, patch:f.patch||'' }))
    });
  } catch (e) { res.status(400).json({ error: e.response?.data?.message || e.message }); }
});

// AI Review
router.post('/review/:prNumber', auth, async (req, res) => {
  const { owner, repo } = req.query;
  const { prNumber } = req.params;
  const { postToGitHub = false } = req.body;
  try {
    const { data: files } = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`, gh(req.user.githubToken));
    const diffText = files.slice(0,5).map(f => `File: ${f.filename}\n${f.patch||'(no patch)'}`).join('\n\n---\n\n').slice(0,4000);
    if (!process.env.GROQ_API_KEY) return res.json({ score:75, summary:'Add GROQ_API_KEY to .env', bugs:[], security:[], suggestions:[] });
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = `Review this PR diff. Return ONLY valid JSON (no markdown):
{"score":<0-100>,"summary":"<one line>","verdict":"approve|request_changes|comment","bugs":[{"file":"<f>","issue":"<desc>","severity":"critical|warning|info"}],"security":["<issue>"],"suggestions":["<tip>"],"praise":["<good thing>"]}
Diff:\n${diffText}`;
    const r = await groq.chat.completions.create({ model:'llama-3.3-70b-versatile', messages:[{role:'user',content:prompt}], max_tokens:1000 });
    const review = JSON.parse(r.choices[0].message.content.replace(/```json\n?|```\n?/g,'').trim());
    if (postToGitHub) {
      const body = `## 🤖 DevFlow AI Review\n\n**Score: ${review.score}/100** | **${review.verdict?.toUpperCase()}**\n\n${review.summary}\n\n${review.bugs?.length?'### Issues\n'+review.bugs.map(b=>`- **${b.severity}** \`${b.file}\`: ${b.issue}`).join('\n'):''}\n\n${review.suggestions?.length?'### Suggestions\n'+review.suggestions.map(s=>`- ${s}`).join('\n'):''}`;
      await axios.post(`https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`, { body }, gh(req.user.githubToken));
      review.postedToGitHub = true;
    }
    res.json(review);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Problem 5: Merge PR
router.put('/merge/:prNumber', auth, async (req, res) => {
  const { owner, repo } = req.query;
  const { prNumber } = req.params;
  const { mergeMethod = 'merge', commitTitle } = req.body;
  try {
    const { data } = await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/merge`,
      { merge_method: mergeMethod, commit_title: commitTitle || `Merge PR #${prNumber} via DevFlow AI` },
      gh(req.user.githubToken)
    );
    res.json({ merged: data.merged, message: data.message, sha: data.sha });
  } catch (e) { res.status(400).json({ error: e.response?.data?.message || e.message }); }
});

module.exports = router;
