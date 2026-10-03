const { verifyToken, cors } = require('./lib/auth');
const { put } = require('@vercel/blob');
const { upsertPhotoSubmission, getTotalEarned } = require('./lib/db');
const { MANDALA_THEMES, getRank } = require('./lib/mandalaData');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const user = verifyToken(req);
    if (!user.team_number) return res.status(403).json({ error: 'チームアカウントが必要です' });

    const { theme_id, mission_id, imageBase64 } = req.body || {};
    if (!theme_id || !mission_id || !imageBase64)
      return res.status(400).json({ error: 'theme_id, mission_id, imageBase64が必要です' });

    const theme   = MANDALA_THEMES.find(t => t.id === theme_id);
    const mission = theme?.missions.find(m => m.id === mission_id);
    if (!mission) return res.status(400).json({ error: 'ミッションが見つかりません' });

    // base64 → Buffer → Vercel Blob にアップロード
    const buffer   = Buffer.from(imageBase64, 'base64');
    const filename = `team${user.team_number}/${theme_id}_${mission_id}_${Date.now()}.jpg`;
    const blob     = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    await upsertPhotoSubmission({
      teamNumber: user.team_number,
      themeId: theme_id,
      missionId: mission_id,
      photoUrl: blob.url,
      points: mission.points,
    });

    const totalEarned = await getTotalEarned(user.team_number);
    const { rank, pct } = getRank(totalEarned);

    res.json({ success: true, photo_url: blob.url, totalEarned, rank: rank.name, rankPct: pct });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
