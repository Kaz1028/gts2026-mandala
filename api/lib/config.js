// Secrets are supplied by the server environment; never use built-in credentials.
function requireSecret(name, minLength) {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim().length < minLength) {
    throw new Error(`${name} must contain at least ${minLength} characters`);
  }
  return value;
}

function getAuthConfig() {
  return {
    jwtSecret: requireSecret('JWT_SECRET', 32),
    adminId: process.env.ADMIN_ID?.trim() || 'admin',
    adminPassword: requireSecret('ADMIN_PASSWORD', 16),
  };
}

function getSeedTeams(maxTeams = 22) {
  const raw = process.env.TEAM_CREDENTIALS_JSON;
  if (!raw) return []; // Existing databases do not need seed credentials.
  let teams;
  try {
    teams = JSON.parse(raw);
  } catch {
    throw new Error('TEAM_CREDENTIALS_JSON must be a JSON array');
  }
  if (!Array.isArray(teams)) throw new Error('TEAM_CREDENTIALS_JSON must be a JSON array');
  const numbers = new Set();
  return teams.map(team => {
    if (!team || !Number.isInteger(team.team_number) || team.team_number < 1 ||
        team.team_number > maxTeams || numbers.has(team.team_number) ||
        typeof team.password !== 'string' || team.password.trim().length < 16) {
      throw new Error(`TEAM_CREDENTIALS_JSON requires unique team numbers (1-${maxTeams}) and passwords of at least 16 characters`);
    }
    numbers.add(team.team_number);
    return { team_number: team.team_number, login_id: `GTS2026_${team.team_number}`, password: team.password };
  });
}

module.exports = { requireSecret, getAuthConfig, getSeedTeams };
