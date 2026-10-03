const { signToken, cors } = require('./lib/auth');
const { getTeamByLogin } = require('./lib/db');
const { getAuthConfig } = require('./lib/config');
const { constantTimeEqual } = require('./lib/passwords');
const { consumeLoginAttempt, clearLoginAttempts } = require('./lib/login-limit');

module.exports = async function handler(req, res) {
  cors(res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  const { login_id, password } = req.body || {};
  if (typeof login_id !== 'string' || !login_id || login_id.length > 128 ||
      (password !== undefined && (typeof password !== 'string' || password.length > 1024)))
    return res.status(400).json({ error: 'チームを選択してください' });
  let config;
  try {
    config = getAuthConfig();
  } catch {
    return res.status(503).json({ error: '認証設定が未完了です。管理者にお問い合わせください' });
  }
  try {
    if (login_id === config.adminId) {
      if (!password) return res.status(400).json({ error: 'IDとパスワードを入力してください' });
      if (!await consumeLoginAttempt(login_id)) {
        res.setHeader('Retry-After', '900');
        return res.status(429).json({ error: 'ログイン試行回数が多すぎます。15分後にお試しください' });
      }
      if (!constantTimeEqual(password, config.adminPassword))
        return res.status(401).json({ error: 'IDまたはパスワードが正しくありません' });
      await clearLoginAttempts(login_id);
      const token = signToken({ role: 'admin', login_id: config.adminId });
      return res.json({ token, role: 'admin', redirect: '/admin.html' });
    }
    // Teams log in by number only (no password), as on the event day.
    const team = await getTeamByLogin(login_id);
    if (!team) return res.status(401).json({ error: 'チームが見つかりません。管理者にお問い合わせください' });
    const token = signToken({ role: 'team', team_number: team.team_number, login_id: team.login_id });
    return res.json({ token, role: 'team', team_number: team.team_number, redirect: '/team.html' });
  } catch {
    return res.status(503).json({ error: 'ログイン処理を利用できません。しばらくしてからお試しください' });
  }
};
