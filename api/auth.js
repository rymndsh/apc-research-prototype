// api/auth.js
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    
    // Support both JSON array (old) and simple string format: "admin:pass,user2:pass2"
    const adminUsersStr = process.env.ADMIN_USERS || 'admin:admin';
    let adminUsers = [];
    
    try {
      // Try parsing as JSON first
      adminUsers = JSON.parse(adminUsersStr);
    } catch (e) {
      // Fallback: parse as comma-separated "user:pass"
      const pairs = adminUsersStr.split(',');
      adminUsers = pairs.map(pair => {
        const [u, p] = pair.split(':').map(s => s.trim());
        return { user: u, pass: p };
      });
    }

    const user = adminUsers.find(u => u.user === username && u.pass === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'default_fallback_secret_do_not_use_in_prod';
    const token = jwt.sign({ username: user.user, role: 'admin' }, secret, { expiresIn: '8h' });

    // Set HttpOnly cookie
    res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Strict`);
    
    return res.status(200).json({ success: true, message: 'Logged in successfully' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
