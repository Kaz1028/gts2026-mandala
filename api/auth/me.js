const { verifyToken, cors } = require('../lib/auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const user = verifyToken(req);
    res.json(user);
  } catch {
    res.status(401).json({ error: '認証が必要です' });
  }
};
