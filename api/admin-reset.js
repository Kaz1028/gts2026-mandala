const { config: event } = require('./lib/event-config');
const { verifyToken, cors } = require('./lib/auth');
const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const user = verifyToken(req);
    if (user.role !== 'admin') return res.status(403).json({ error: '管理者権限が必要です' });

    const { team_number } = req.body || {};
    if (!team_number || team_number < 1 || team_number > event.teamCount)
      return res.status(400).json({ error: '不正なチーム番号' });

    const { rowCount: subs } = await sql`DELETE FROM submissions WHERE team_number = ${team_number}`;
    const { rowCount: bens } = await sql`DELETE FROM benefits   WHERE team_number = ${team_number}`;

    res.json({ success: true, deleted: { submissions: subs, benefits: bens } });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
