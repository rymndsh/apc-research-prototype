// api/upload.js
const { put } = require('@vercel/blob');
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

  // Handle upload
  try {
    const filename = req.query.filename || 'uploaded-file-' + Date.now();
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("BLOB_READ_WRITE_TOKEN is not set. Simulating upload for prototype.");
      return res.status(200).json({
        url: `https://dummyimage.com/600x400/0ea5e9/ffffff.png&text=${encodeURIComponent(filename)}`,
        pathname: filename
      });
    }

    // Assuming the body is the file stream/buffer
    const blob = await put(filename, req, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return res.status(200).json(blob);
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
};
