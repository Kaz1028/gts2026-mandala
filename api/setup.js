const { initDB } = require('./lib/db');
const { cors, verifyToken } = require('./lib/auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const user = verifyToken(req);
    if (user.role !== 'admin') return res.status(403).json({ error: '管理者権限が必要です' });
  } catch {
    return res.status(401).json({ error: '管理者としてログインしてください' });
  }
  try {
    await initDB();
    res.json({ success: true, message: 'DB initialized. Configured teams seeded.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB初期化に失敗しました。サーバー設定を確認してください' });
  }
};
