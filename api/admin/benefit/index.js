const { verifyToken, cors } = require('../../lib/auth');
const { addBenefit } = require('../../lib/db');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const user = verifyToken(req);
    if (user.role !== 'admin') return res.status(403).json({ error: '管理者権限が必要です' });

    const { team_number, title, description } = req.body || {};
    if (!team_number || !title) return res.status(400).json({ error: 'team_numberとtitleが必要です' });

    const id = await addBenefit({ teamNumber: team_number, title, description });
    res.json({ success: true, id });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
