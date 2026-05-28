// api/read.js
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify auth
  const cookieHeader = req.headers.cookie || '';
  const tokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
  if (!tokenMatch) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const secret = process.env.JWT_SECRET || 'default_fallback_secret_do_not_use_in_prod';
    jwt.verify(tokenMatch[1], secret);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const path = req.query.path;
    if (!path) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    let githubRepo = process.env.GITHUB_REPO;
    if (githubRepo) {
      githubRepo = githubRepo.replace('https://github.com/', '').replace('.git', '').replace(/\/$/, '');
    }

    if (!githubToken || !githubRepo) {
      return res.status(500).json({ error: 'GitHub config not set' });
    }

    const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${path}`;
    const getResp = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'APC-Admin-App'
      }
    });

    if (getResp.ok) {
      const data = await getResp.text();
      return res.status(200).json({ success: true, content: data });
    } else {
      return res.status(getResp.status).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Read error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
