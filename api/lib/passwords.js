const { randomBytes, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const digest = value => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 16 || password.length > 1024)
    throw new Error('Password must contain 16-1024 characters');
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64, options);
  return 'scrypt$' + salt + '$' + key.toString('hex');
}

async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 1024 || typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt' || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2]))
    return false;
  const key = await derive(password, parts[1], 64, options);
  return timingSafeEqual(key, Buffer.from(parts[2], 'hex'));
}

module.exports = { hashPassword, verifyPassword, constantTimeEqual };
