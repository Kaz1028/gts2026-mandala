const event = require('../event.config');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { randomBytes } = require('node:crypto');
const jwt = require('jsonwebtoken');
const { getAuthConfig, getSeedTeams } = require('../api/lib/config');
const { signToken, verifyToken } = require('../api/lib/auth');

function load(file, overrides = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const nativeRequire = createRequire(filename);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, exports: module.exports, process, console, __dirname: path.dirname(filename),
    require: id => Object.hasOwn(overrides, id) ? overrides[id] : nativeRequire(id),
  }, { filename });
  return module.exports;
}
async function call(handler, method, body, token) {
  const res = {
    code: 200,
    setHeader() {},
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; },
    end() { return this; },
  };
  await handler({ method, body, headers: token ? { authorization: 'Bearer ' + token } : {} }, res);
  return res;
}

test('credential configuration and login boundaries (no external services)', async t => {
  const keys = ['JWT_SECRET', 'ADMIN_ID', 'ADMIN_PASSWORD'];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const secret = randomBytes(32).toString('hex');
  const password = randomBytes(24).toString('hex');
  let dbCalls = 0;
  const db = {
    async getTeamByLogin(id) {
      dbCalls++;
      return id === (event.loginPrefix + '1') ? { login_id: id, team_number: 1 } : null;
    },
    async initDB() { dbCalls++; },
  };
  let limitCalls = 0;
  const login = load('api/auth-login.js', { './lib/db': db, './lib/login-limit': { async consumeLoginAttempt() { limitCalls++; return true; }, async clearLoginAttempts() {} } });
  const setup = load('api/setup.js', { './lib/db': db });
  try {
    keys.forEach(key => delete process.env[key]);
    await t.test('missing configuration blocks login without accessing DB', async () => {
      assert.throws(getAuthConfig, /JWT_SECRET/);
      assert.throws(() => signToken({ role: 'admin' }), /JWT_SECRET/);
      const res = await call(login, 'POST', { login_id: 'admin', password });
      assert.equal(res.code, 503);
      assert.equal(dbCalls, 0);
      assert.ok(!JSON.stringify(res.data).includes(password));
    });
    process.env.JWT_SECRET = secret;
    await t.test('missing or short admin password blocks login', async () => {
      for (const value of ['', 'short']) {
        process.env.ADMIN_PASSWORD = value;
        assert.equal((await call(login, 'POST', { login_id: 'admin', password })).code, 503);
      }
    });
    process.env.ADMIN_PASSWORD = password;
    process.env.ADMIN_ID = 'organizer';
    await t.test('configured admin can log in before database initialization', async () => {
      const res = await call(login, 'POST', { login_id: 'organizer', password });
      assert.equal(res.code, 200);
      const claims = verifyToken({ headers: { authorization: 'Bearer ' + res.data.token } });
      assert.equal(claims.role, 'admin');
      assert.equal(claims.login_id, 'organizer');
      assert.equal(dbCalls, 0);
    });
    await t.test('wrong admin password is rejected without falling through to a team', async () => {
      assert.equal((await call(login, 'POST', { login_id: 'organizer', password: 'wrong' })).code, 401);
      assert.equal(dbCalls, 0);
    });
    await t.test('teams log in with their ID only; unknown teams are rejected', async () => {
      const before = limitCalls;
      const res = await call(login, 'POST', { login_id: (event.loginPrefix + '1') });
      assert.equal(res.code, 200);
      assert.equal(res.data.role, 'team');
      assert.equal(res.data.team_number, 1);
      const claims = verifyToken({ headers: { authorization: 'Bearer ' + res.data.token } });
      assert.equal(claims.role, 'team');
      assert.equal(claims.team_number, 1);
      assert.equal((await call(login, 'POST', { login_id: (event.loginPrefix + '999') })).code, 401);
      assert.equal(limitCalls, before);
    });
    await t.test('admin login still requires the admin password', async () => {
      assert.equal((await call(login, 'POST', { login_id: 'organizer' })).code, 400);
      assert.equal((await call(login, 'POST', { login_id: 'organizer', password: '' })).code, 400);
    });
    await t.test('invalid login input and unsupported methods are rejected', async () => {
      for (const body of [{}, { login_id: {}, password }, { login_id: 'organizer', password: [] }]) {
        assert.equal((await call(login, 'POST', body)).code, 400);
      }
      assert.equal((await call(login, 'GET')).code, 405);
      assert.equal((await call(login, 'OPTIONS')).code, 200);
    });
    await t.test('JWTs reject missing, expired, tampered and different-algorithm tokens', () => {
      assert.throws(() => verifyToken({ headers: {} }));
      for (const token of [
        jwt.sign({ role: 'admin' }, secret, { expiresIn: -1 }),
        jwt.sign({ role: 'admin' }, randomBytes(32).toString('hex')),
        jwt.sign({ role: 'admin' }, secret, { algorithm: 'HS384' }),
      ]) assert.throws(() => verifyToken({ headers: { authorization: 'Bearer ' + token } }));
      process.env.JWT_SECRET = 'short';
      assert.throws(() => signToken({ role: 'admin' }), /JWT_SECRET/);
      process.env.JWT_SECRET = secret;
    });
    await t.test('only authenticated admins may initialize the DB with POST', async () => {
      const before = dbCalls;
      assert.equal((await call(setup, 'GET')).code, 405);
      assert.equal((await call(setup, 'POST')).code, 401);
      assert.equal((await call(setup, 'POST', {}, signToken({ role: 'team', team_number: 1 }))).code, 403);
      assert.equal((await call(setup, 'OPTIONS')).code, 200);
      assert.equal(dbCalls, before);
      assert.equal((await call(setup, 'POST', {}, signToken({ role: 'admin' }))).code, 200);
      assert.equal(dbCalls, before + 1);
    });
    await t.test('teams 1..teamCount are created without passwords', () => {
      const teams = getSeedTeams();
      assert.equal(teams.length, event.teamCount);
      assert.deepEqual(teams[0], { team_number: 1, login_id: (event.loginPrefix + '1') });
      assert.ok(teams.every(team => !('password' in team)));
    });
    await t.test('Postgres seed creates every team once and keeps existing rows', async () => {
      const queries = [];
      const pg = load('api/lib/db.js', { '@vercel/postgres': {
        async sql(strings, ...values) { queries.push({ text: strings.join('?'), values }); return { rows: [] }; },
      } });
      await pg.initDB();
      assert.equal(queries.length, 3 + event.teamCount);
      assert.match(queries[3].text, /ON CONFLICT \(login_id\) DO NOTHING/);
      assert.deepEqual(queries[3].values, [(event.loginPrefix + '1'), 1]);
    });
    await t.test('alternate login and auth entry points share the fixed implementation', () => {
      assert.equal(require('../api/auth/login'), require('../api/auth-login'));
      assert.equal(require('../lib/auth').signToken, signToken);
    });
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

test('team login page logs in by choosing a team number, without a password', async () => {
  const elements = new Map();
  function element() {
    return { value: '', style: {}, listeners: {}, children: [], disabled: false,
      classList: { add() {}, remove() {} },
      addEventListener(name, fn) { this.listeners[name] = fn; },
      appendChild(child) { this.children.push(child); },
      focus() {},
    };
  }
  const requests = [];
  const storage = new Map();
  const context = {
    document: {
      getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
      createElement: element,
    },
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    window: { location: {}, EVENT_CONFIG: event },
    async fetch(url, options) {
      requests.push({ url, body: JSON.parse(options.body) });
      return { ok: true, async json() { return { token: 'test', role: 'team', team_number: 1 }; } };
    },
  };
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, context);
  assert.equal(elements.get('modalGrid').children.length, event.teamCount);
  assert.equal(requests.length, 0);
  await elements.get('modalGrid').children[0].listeners.click();
  assert.deepEqual(requests, [{ url: '/api/auth/login', body: { login_id: (event.loginPrefix + '1') } }]);
  assert.equal(context.window.location.href, '/team.html');
});


test('admin password comparison is exact', () => {
  const { constantTimeEqual } = require('../api/lib/passwords');
  const password = randomBytes(24).toString('base64url');
  assert.equal(constantTimeEqual(password, password), true);
  assert.equal(constantTimeEqual(password, undefined), false);
  assert.equal(constantTimeEqual(password, 'wrong'), false);
});
test('login limits use a shared atomic DB counter and hide account identifiers', async () => {
  const saved = process.env.JWT_SECRET;
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  let count = 0;
  const queries = [];
  const limiter = load('api/lib/login-limit.js', { '@vercel/postgres': {
    async sql(strings, ...values) {
      const text = strings.join('?');
      queries.push({ text, values });
      if (text.includes('INSERT INTO')) return { rows: [{ attempts: ++count }] };
      return { rows: [] };
    },
  } });
  try {
    for (let i = 0; i < 10; i++) assert.equal(await limiter.consumeLoginAttempt('sample-account'), true);
    assert.equal(await limiter.consumeLoginAttempt('sample-account'), false);
    const insert = queries.find(q => q.text.includes('INSERT INTO'));
    assert.match(insert.text, /ON CONFLICT/);
    assert.match(insert.text, /INTERVAL '15 minutes'/);
    assert.ok(!JSON.stringify(queries).includes('sample-account'));
    await limiter.clearLoginAttempts('sample-account');
    assert.match(queries.at(-1).text, /DELETE FROM login_attempts WHERE key/);
  } finally {
    if (saved === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = saved;
  }
});
test('rate limited and unavailable logins never authenticate', async () => {
  const saved = { JWT_SECRET: process.env.JWT_SECRET, ADMIN_PASSWORD: process.env.ADMIN_PASSWORD, ADMIN_ID: process.env.ADMIN_ID };
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  process.env.ADMIN_PASSWORD = randomBytes(24).toString('hex');
  process.env.ADMIN_ID = 'admin';
  try {
    for (const [consumeLoginAttempt, code] of [
      [async () => false, 429],
      [async () => { throw Error('private database details'); }, 503],
    ]) {
      const handler = load('api/auth-login.js', {
        './lib/login-limit': { consumeLoginAttempt, async clearLoginAttempts() { throw Error('must not authenticate'); } },
        './lib/db': { async getTeamByLogin() { throw Error('must not access teams'); } },
      });
      const res = await call(handler, 'POST', { login_id: 'admin', password: process.env.ADMIN_PASSWORD });
      assert.equal(res.code, code);
      assert.ok(!JSON.stringify(res.data).includes('private'));
    }
  } finally {
    for (const [key,value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
