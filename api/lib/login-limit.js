const { sql } = require('@vercel/postgres');
const { createHmac } = require('node:crypto');
const { requireSecret } = require('./config');

async function consumeLoginAttempt(loginId) {
  // Shared by all serverless instances; no password or plaintext login ID is stored.
  const key = createHmac('sha256', requireSecret('JWT_SECRET', 32)).update(loginId).digest('hex');
  await sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      key TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL,
      window_start TIMESTAMPTZ NOT NULL
    )
  `;
  await sql`DELETE FROM login_attempts WHERE window_start < NOW() - INTERVAL '1 day'`;
  const { rows } = await sql`
    INSERT INTO login_attempts (key, attempts, window_start) VALUES (${key}, 1, NOW())
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN login_attempts.window_start <= NOW() - INTERVAL '15 minutes'
        THEN 1 ELSE login_attempts.attempts + 1 END,
      window_start = CASE WHEN login_attempts.window_start <= NOW() - INTERVAL '15 minutes'
        THEN NOW() ELSE login_attempts.window_start END
    RETURNING attempts
  `;
  return rows[0].attempts <= 10;
}

async function clearLoginAttempts(loginId) {
  const key = createHmac('sha256', requireSecret('JWT_SECRET', 32)).update(loginId).digest('hex');
  await sql`DELETE FROM login_attempts WHERE key = ${key}`;
}

module.exports = { consumeLoginAttempt, clearLoginAttempts };
