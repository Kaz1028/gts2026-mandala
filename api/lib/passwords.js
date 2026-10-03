const { timingSafeEqual, createHash } = require('node:crypto');

// Used for the admin password. Teams have no passwords.
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const digest = value => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

module.exports = { constantTimeEqual };
