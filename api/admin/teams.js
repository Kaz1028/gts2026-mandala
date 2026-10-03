const { verifyToken, cors } = require('../lib/auth');
const { getAllTeamsSummary } = require('../lib/db');
const { TOTAL_MISSIONS, TOTAL_POINTS, getRank } = require('../lib/mandalaData');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const user = verifyToken(req);
    if (user.role !== 'admin') return res.status(403).json({ error: '管理者権限が必要です' });

    const teams = await getAllTeamsSummary();
    const result = teams.map(t => {
      const { rank, pct } = getRank(t.totalEarned);
      return { ...t, totalMissions: TOTAL_MISSIONS, totalPoints: TOTAL_POINTS, rank: rank.name, rankPct: pct };
    });
    res.json(result);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
