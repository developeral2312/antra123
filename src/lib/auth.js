const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'antra_super_secure_jwt_secret_key_2026';
const COOKIE_NAME = 'antra_session';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function getSessionUser(req) {
  // Check cookie or authorization header
  let token = null;

  // Next.js standard cookie parser
  if (req.cookies && req.cookies.get) {
    const cookie = req.cookies.get(COOKIE_NAME);
    token = cookie ? cookie.value : null;
  } else if (req.headers && req.headers.cookie) {
    const match = req.headers.cookie.match(new RegExp('(^|;)\\s*' + COOKIE_NAME + '=([^;]+)'));
    if (match) token = match[2];
  }

  if (!token && req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

module.exports = {
  JWT_SECRET,
  COOKIE_NAME,
  signToken,
  verifyToken,
  getSessionUser
};
