const express = require('express');
const axios   = require('axios');
const auth    = require('../middleware/auth');
const router  = express.Router();

const gh = (token) => ({ headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });

router.post('/connect', auth, async (req, res) => {
  const { repoUrl } = req.body;
  try {
    const m = repoUrl.match(/github\.com\/([^/]+)\/([^/\s.]+)/);
    if (!m) throw new Error('Invalid GitHub URL. Format: https://github.com/owner/repo');
    const [, owner, repo] = m;
    const { data } = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, gh(req.user.githubToken));
    res.json({ owner, repo, fullName: data.full_name, defaultBranch: data.default_branch, private: data.private, description: data.description });
  } catch (e) { res.status(400).json({ error: e.response?.data?.message || e.message }); }
});

router.get('/tree', auth, async (req, res) => {
  const { owner, repo, branch = 'main' } = req.query;
  try {
    const { data } = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, gh(req.user.githubToken));
    res.json({ files: data.tree.filter(f => f.type === 'blob').map(f => ({ path: f.path, sha: f.sha })), truncated: data.truncated });
  } catch (e) { res.status(400).json({ error: e.response?.data?.message || e.message }); }
});

router.get('/file', auth, async (req, res) => {
  const { owner, repo, path, branch = 'main' } = req.query;
  try {
    const { data } = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, gh(req.user.githubToken));
    res.json({ content: Buffer.from(data.content, 'base64').toString('utf8'), sha: data.sha, path: data.path });
  } catch (e) { res.status(400).json({ error: e.response?.data?.message || e.message }); }
});

router.put('/file', auth, async (req, res) => {
  const { owner, repo, path, content, sha, message = 'Update via DevFlow AI', branch = 'main' } = req.body;
  try {
    const body = { message, content: Buffer.from(content).toString('base64'), branch };
    if (sha) body.sha = sha;
    const { data } = await axios.put(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, body, gh(req.user.githubToken));
    res.json({ sha: data.content.sha, commitSha: data.commit.sha });
  } catch (e) { res.status(400).json({ error: e.response?.data?.message || e.message }); }
});

module.exports = router;
