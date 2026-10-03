const { validateMissionConfig } = require('./mission-config');
const data = validateMissionConfig(require('../../missions.json'));
const MANDALA_CENTER = data.center;
const MANDALA_THEMES = data.themes;
const RANKS = data.ranks;
const TOTAL_MISSIONS = MANDALA_THEMES.reduce((s,t) => s+t.missions.length,0);
const TOTAL_POINTS = MANDALA_THEMES.reduce((s,t) => s+t.missions.reduce((n,m) => n+m.points,0),0);

function getRank(earnedPoints) {
  const pct = Math.min(100, Math.floor((earnedPoints / TOTAL_POINTS) * 100));
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (pct >= r.minPct) rank = r;
    else break;
  }
  return { rank, pct };
}

module.exports = { MANDALA_CENTER, MANDALA_THEMES, TOTAL_MISSIONS, TOTAL_POINTS, RANKS, getRank };
