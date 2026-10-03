const { verifyToken, cors } = require('./lib/auth');
const { deleteBenefit } = require('./lib/db');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).end();
  try {
    const user = verifyToken(req);
    if (user.role !== 'admin') return res.status(403).json({ error: '管理者権限が必要です' });

    await deleteBenefit(req.query.id);
    res.json({ success: true });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
