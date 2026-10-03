const { verifyToken, cors } = require('../lib/auth');
const { upsertSubmission, getTotalEarned, getSubmissions } = require('../lib/db');
const { MANDALA_THEMES, getRank } = require('../lib/mandalaData');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const user = verifyToken(req);
    if (!user.team_number) return res.status(403).json({ error: 'チームアカウントが必要です' });

    const { theme_id, mission_id, mission_type, text_content, toggle } = req.body || {};
    if (!theme_id || !mission_id) return res.status(400).json({ error: 'theme_idとmission_idが必要です' });

    const theme   = MANDALA_THEMES.find(t => t.id === theme_id);
    const mission = theme?.missions.find(m => m.id === mission_id);
    if (!mission) return res.status(400).json({ error: 'ミッションが見つかりません' });

    // checkタイプはトグル、それ以外は常にdone
    let newStatus = 'done';
    if (toggle) {
      const subs = await getSubmissions(user.team_number);
      const existing = subs.find(s => s.theme_id === theme_id && s.mission_id === mission_id);
      if (existing?.status === 'done') newStatus = 'not_done';
    }

    await upsertSubmission({
      teamNumber: user.team_number,
      themeId: theme_id,
      missionId: mission_id,
      missionType: mission_type || mission.type,
      status: newStatus,
      textContent: text_content || null,
      points: newStatus === 'done' ? mission.points : 0,
    });

    const totalEarned = await getTotalEarned(user.team_number);
    const { rank, pct } = getRank(totalEarned);

    res.json({ success: true, status: newStatus, totalEarned, rank: rank.name, rankPct: pct });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
