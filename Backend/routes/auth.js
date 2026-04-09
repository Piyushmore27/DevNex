const express = require('express');
const axios   = require('axios');
const jwt     = require('jsonwebtoken');
const router  = express.Router();

const CLIENT_ID     = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const JWT_SECRET    = process.env.JWT_SECRET || 'devflow-secret-key';
const CLIENT_URL    = process.env.CLIENT_URL || 'http://localhost:5173';

// Redirect to GitHub OAuth
router.get('/github', (_, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,workflow,read:user,user:email`;
  res.redirect(url);
});

// GitHub callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${CLIENT_URL}?error=no_code`);
  try {
    // Exchange code → access_token
    const { data: tokenData } = await axios.post(
      'https://github.com/login/oauth/access_token',
      { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code },
      { headers: { Accept: 'application/json' } }
    );
    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error('No access token');

    // Get GitHub user
    const { data: user } = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // Create app JWT — embed githubToken inside (server-side only use)
    const appToken = jwt.sign(
      { githubId: user.id, login: user.login, name: user.name || user.login, avatar: user.avatar_url, githubToken: accessToken },
      JWT_SECRET, { expiresIn: '7d' }
    );

    res.redirect(`${CLIENT_URL}?token=${appToken}`);
  } catch (err) {
    res.redirect(`${CLIENT_URL}?error=${encodeURIComponent(err.message)}`);
  }
});

// Get current user
router.get('/me', require('../middleware/auth'), (req, res) => {
  const { githubToken, iat, exp, ...safe } = req.user;
  res.json(safe);
});

module.exports = router;
