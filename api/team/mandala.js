const { verifyToken, cors } = require('../lib/auth');
const { getSubmissions, getTotalEarned } = require('../lib/db');
const { MANDALA_THEMES, MANDALA_CENTER, TOTAL_MISSIONS, TOTAL_POINTS, getRank } = require('../lib/mandalaData');
const path = require('path');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const user = verifyToken(req);
    if (!user.team_number) return res.status(403).json({ error: 'チームアカウントが必要です' });

    const subs = await getSubmissions(user.team_number);
    const subMap = {};
    subs.forEach(s => { subMap[`${s.theme_id}_${s.mission_id}`] = s; });

    const themes = MANDALA_THEMES.map(theme => ({
      ...theme,
      missions: theme.missions.map(m => {
        const sub = subMap[`${theme.id}_${m.id}`] || {};
        return {
          ...m,
          status: sub.status || 'not_done',
          text_content: sub.text_content || null,
          photo_url: sub.photo_url || null,
          earned_points: sub.status === 'done' ? m.points : 0,
        };
      })
    }));

    const totalEarned = subs.filter(s => s.status === 'done').reduce((sum, s) => sum + (s.points || 0), 0);
    const doneCount   = subs.filter(s => s.status === 'done').length;
    const { rank, pct } = getRank(totalEarned);

    res.json({
      team_number: user.team_number,
      center: MANDALA_CENTER,
      themes,
      stats: { totalEarned, doneCount, totalMissions: TOTAL_MISSIONS, totalPoints: TOTAL_POINTS, rankPct: pct },
      rank: rank.name,
    });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
