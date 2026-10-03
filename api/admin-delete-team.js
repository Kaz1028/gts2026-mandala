const { verifyToken, cors } = require('./lib/auth');
const { deleteTeam } = require('./lib/db');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const user = verifyToken(req);
    if (user.role !== 'admin') return res.status(403).json({ error: '管理者権限が必要です' });

    const { team_number } = req.body || {};
    if (!team_number || team_number < 1)
      return res.status(400).json({ error: '不正なチーム番号' });

    const rowCount = await deleteTeam(team_number);
    res.json({ success: true, deletedTeamRow: rowCount });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
