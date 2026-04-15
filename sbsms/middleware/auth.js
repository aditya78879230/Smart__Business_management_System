const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'sbsms_secret_2025';

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return [auth, (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: 'Access denied' });
    next();
  }];
}

module.exports = { auth, requireRole, SECRET };
