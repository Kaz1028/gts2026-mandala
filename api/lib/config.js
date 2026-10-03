const { config: event } = require('./event-config');
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

// Teams log in by choosing their number; no team passwords are issued.
function getSeedTeams(maxTeams = event.teamCount) {
  return Array.from({ length: maxTeams }, (_, i) => ({
    team_number: i + 1, login_id: event.loginPrefix + (i + 1),
  }));
}

module.exports = { requireSecret, getAuthConfig, getSeedTeams };
