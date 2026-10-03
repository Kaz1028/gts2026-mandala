const { sql } = require('@vercel/postgres');
const { getSeedTeams } = require('./config');
const { hashPassword, verifyPassword } = require('./passwords');

async function initDB() {
  const teams = getSeedTeams();
  await sql`
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      login_id TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      team_number INTEGER UNIQUE NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      team_number INTEGER NOT NULL,
      theme_id TEXT NOT NULL,
      mission_id TEXT NOT NULL,
      mission_type TEXT NOT NULL,
      status TEXT DEFAULT 'not_done',
      text_content TEXT,
      photo_url TEXT,
      points INTEGER DEFAULT 0,
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(team_number, theme_id, mission_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS benefits (
      id SERIAL PRIMARY KEY,
      team_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      claimed BOOLEAN DEFAULT FALSE,
      granted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Only explicitly configured teams are created. Existing credentials stay unchanged.
  for (const team of teams) {
    const passwordHash = await hashPassword(team.password);
    await sql`
      INSERT INTO teams (login_id, password, team_number)
      VALUES (${team.login_id}, ${passwordHash}, ${team.team_number})
      ON CONFLICT (login_id) DO NOTHING
    `;
  }
}

async function getTeamByLogin(loginId, password) {
  const { rows } = await sql`
    SELECT * FROM teams WHERE login_id = ${loginId}
  `;
  const team = rows[0];
  return team && await verifyPassword(password, team.password) ? team : null;
}

async function getSubmissions(teamNumber) {
  const { rows } = await sql`
    SELECT theme_id, mission_id, status, text_content, photo_url, points, submitted_at
    FROM submissions WHERE team_number = ${teamNumber}
  `;
  return rows;
}

async function upsertSubmission({ teamNumber, themeId, missionId, missionType, status, textContent, points }) {
  await sql`
    INSERT INTO submissions (team_number, theme_id, mission_id, mission_type, status, text_content, points)
    VALUES (${teamNumber}, ${themeId}, ${missionId}, ${missionType}, ${status}, ${textContent}, ${points})
    ON CONFLICT (team_number, theme_id, mission_id) DO UPDATE
      SET status = EXCLUDED.status,
          text_content = EXCLUDED.text_content,
          points = EXCLUDED.points,
          submitted_at = NOW()
  `;
}

async function upsertPhotoSubmission({ teamNumber, themeId, missionId, photoUrl, points }) {
  await sql`
    INSERT INTO submissions (team_number, theme_id, mission_id, mission_type, status, photo_url, points)
    VALUES (${teamNumber}, ${themeId}, ${missionId}, 'photo', 'done', ${photoUrl}, ${points})
    ON CONFLICT (team_number, theme_id, mission_id) DO UPDATE
      SET status = 'done',
          photo_url = EXCLUDED.photo_url,
          points = EXCLUDED.points,
          submitted_at = NOW()
  `;
}

async function getTotalEarned(teamNumber) {
  const { rows } = await sql`
    SELECT COALESCE(SUM(points), 0) AS total FROM submissions
    WHERE team_number = ${teamNumber} AND status = 'done'
  `;
  return parseInt(rows[0].total);
}

async function getAllTeamsSummary() {
  const { rows: teams } = await sql`SELECT team_number, login_id FROM teams ORDER BY team_number`;
  const { rows: subs } = await sql`SELECT team_number, status, points FROM submissions`;
  const { rows: bens } = await sql`SELECT team_number, COUNT(*) AS cnt FROM benefits GROUP BY team_number`;

  const benMap = {};
  bens.forEach(b => { benMap[b.team_number] = parseInt(b.cnt); });

  return teams.map(t => {
    const teamSubs = subs.filter(s => s.team_number === t.team_number);
    const doneCount = teamSubs.filter(s => s.status === 'done').length;
    const totalEarned = teamSubs.filter(s => s.status === 'done').reduce((sum, s) => sum + (s.points || 0), 0);
    return { ...t, doneCount, totalEarned, benefitCount: benMap[t.team_number] || 0 };
  });
}

async function getTeamDetail(teamNumber) {
  const { rows: subs } = await sql`SELECT * FROM submissions WHERE team_number = ${teamNumber}`;
  const { rows: benefits } = await sql`SELECT * FROM benefits WHERE team_number = ${teamNumber} ORDER BY granted_at DESC`;
  return { subs, benefits };
}

async function addBenefit({ teamNumber, title, description }) {
  const { rows } = await sql`
    INSERT INTO benefits (team_number, title, description) VALUES (${teamNumber}, ${title}, ${description || ''})
    RETURNING id
  `;
  return rows[0].id;
}

async function deleteBenefit(id) {
  await sql`DELETE FROM benefits WHERE id = ${id}`;
}

async function deleteTeam(teamNumber) {
  await sql`DELETE FROM submissions WHERE team_number = ${teamNumber}`;
  await sql`DELETE FROM benefits WHERE team_number = ${teamNumber}`;
  const { rowCount } = await sql`DELETE FROM teams WHERE team_number = ${teamNumber}`;
  return rowCount;
}

module.exports = {
  initDB, getTeamByLogin, getSubmissions, upsertSubmission,
  upsertPhotoSubmission, getTotalEarned, getAllTeamsSummary,
  getTeamDetail, addBenefit, deleteBenefit, deleteTeam
};
