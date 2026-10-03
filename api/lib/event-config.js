const config = require('../../event.config');
function validateEventConfig(c) {
  for (const key of ['organizationName','eventName','description','emblem'])
    if (typeof c[key] !== 'string' || !c[key].trim() || c[key].length > 200) throw Error('event.config.js: invalid ' + key);
  if (!Number.isInteger(c.teamCount) || c.teamCount < 1 || c.teamCount > 100) throw Error('event.config.js: teamCount must be 1-100');
  if (typeof c.loginPrefix !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(c.loginPrefix)) throw Error('event.config.js: invalid loginPrefix');
  for (const key of ['primaryColor','darkColor'])
    if (typeof c[key] !== 'string' || !/^#[a-f0-9]{6}$/i.test(c[key])) throw Error('event.config.js: invalid ' + key);
  return c;
}
validateEventConfig(config);
module.exports = { config, validateEventConfig };
