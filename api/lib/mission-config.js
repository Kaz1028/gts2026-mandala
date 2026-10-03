function validateMissionConfig(c) {
  const text = (v, name) => { if (typeof v !== 'string' || !v.trim()) throw Error('missions.json: missing ' + name); };
  if (!c || !c.center) throw Error('missions.json: center is required');
  text(c.center.name, 'center.name');
  if (!Array.isArray(c.themes) || c.themes.length !== 8) throw Error('missions.json: exactly 8 themes required');
  const ids = new Set();
  c.themes.forEach((t,i) => {
    if (t.id !== 'theme_' + i) throw Error('missions.json: keep theme_0 through theme_7 in order');
    text(t.name,'theme.name'); text(t.emblem,'theme.emblem');
    if (!Array.isArray(t.missions) || !t.missions.length || t.missions.length > 30) throw Error('missions.json: 1-30 missions per theme');
    t.missions.forEach(m => {
      if (typeof m.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(m.id) || ids.has(m.id)) throw Error('missions.json: invalid or duplicate mission ID');
      ids.add(m.id); text(m.text,'mission.text');
      if (!['check','text','photo'].includes(m.type)) throw Error('missions.json: invalid mission type');
      if (!Number.isInteger(m.points) || m.points < 1 || m.points > 100) throw Error('missions.json: points must be 1-100');
      if (!Number.isInteger(m.stars) || m.stars < 1 || m.stars > 3) throw Error('missions.json: stars must be 1-3');
    });
  });
  if (!Array.isArray(c.ranks) || !c.ranks.length || c.ranks[0].minPct !== 0) throw Error('missions.json: ranks must start at 0');
  c.ranks.forEach((r,i) => {
    text(r.name,'rank.name');
    if (!Number.isInteger(r.minPct) || r.minPct < 0 || r.minPct > 100 || (i && r.minPct <= c.ranks[i-1].minPct)) throw Error('missions.json: rank percentages must increase');
  });
  return c;
}
module.exports = { validateMissionConfig };
