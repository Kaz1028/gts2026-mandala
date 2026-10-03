const jwt = require('jsonwebtoken');

const { requireSecret } = require('./config');

function signToken(payload) {
  return jwt.sign(payload, requireSecret('JWT_SECRET', 32), { expiresIn: '12h', algorithm: 'HS256' });
}

function verifyToken(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) throw new Error('トークンがありません');
  return jwt.verify(token, requireSecret('JWT_SECRET', 32), { algorithms: ['HS256'] });
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
}

module.exports = { signToken, verifyToken, cors };
