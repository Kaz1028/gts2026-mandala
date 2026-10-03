const { config: event } = require('./lib/event-config');
const { verifyToken, cors } = require('./lib/auth');
const { getTeamDetail } = require('./lib/db');
const { MANDALA_THEMES, TOTAL_MISSIONS, TOTAL_POINTS, getRank } = require('./lib/mandalaData');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const user = verifyToken(req);
    if (user.role !== 'admin') return res.status(403).json({ error: '管理者権限が必要です' });

    const num = parseInt(req.query.num);
    if (!num || num < 1 || num > event.teamCount) return res.status(400).json({ error: '不正なチーム番号' });

    const { subs, benefits } = await getTeamDetail(num);
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
          submitted_at: sub.submitted_at || null,
          earned_points: sub.status === 'done' ? m.points : 0,
        };
      })
    }));

    const totalEarned = subs.filter(s => s.status === 'done').reduce((sum, s) => sum + (s.points || 0), 0);
    const doneCount   = subs.filter(s => s.status === 'done').length;
    const { rank, pct } = getRank(totalEarned);

    res.json({
      team_number: num,
      themes,
      stats: { totalEarned, doneCount, totalMissions: TOTAL_MISSIONS, totalPoints: TOTAL_POINTS, rankPct: pct },
      rank: rank.name,
      benefits,
    });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
