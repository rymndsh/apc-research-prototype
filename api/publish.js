// api/publish.js
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
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
    const payload = req.body;
    
    // Check if we have path and content
    if (!payload || !payload.path || payload.content === undefined) {
      return res.status(400).json({ error: 'Missing required data (path, content)' });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    // Strip trailing slash or full URL if they accidentally pasted the full github URL
    let githubRepo = process.env.GITHUB_REPO; 
    if (githubRepo) {
      githubRepo = githubRepo.replace('https://github.com/', '').replace('.git', '').replace(/\/$/, '');
    }
    
    if (!githubToken || !githubRepo) {
      console.warn("GitHub environment variables are not set. Simulating success for prototype.");
      return res.status(200).json({ success: true, message: 'Data accepted (Simulation mode - no GitHub commit made)' });
    }

    const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${payload.path}`;
    
    // 1. Get current file SHA
    let fileSha = null;
    try {
      const getResp = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'APC-Admin-App'
        }
      });
      if (getResp.ok) {
        const getData = await getResp.json();
        fileSha = getData.sha;
      }
    } catch (e) {
      console.error('Error fetching file SHA:', e);
    }

    // 2. PUT new content
    const contentBase64 = Buffer.from(payload.content).toString('base64');
    const putPayload = {
      message: payload.message || `Admin: Update ${payload.path}`,
      content: contentBase64,
      branch: 'main'
    };
    if (fileSha) {
      putPayload.sha = fileSha;
    }

    const putResp = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'APC-Admin-App'
      },
      body: JSON.stringify(putPayload)
    });

    if (putResp.ok) {
      return res.status(200).json({ success: true, message: 'Published successfully to GitHub' });
    } else {
      const errData = await putResp.json();
      console.error('GitHub API error:', errData);
      return res.status(500).json({ error: `GitHub Error: ${errData.message}` });
    }
  } catch (error) {
    console.error('Publish error:', error);
    return res.status(500).json({ error: 'Publish failed' });
  }
};
