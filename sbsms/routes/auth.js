const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone, role, city } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email=?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const safeRole = ['customer','owner'].includes(role) ? role : 'customer';
    const [result] = await db.query(
      'INSERT INTO users (name,email,password,phone,role,city) VALUES (?,?,?,?,?,?)',
      [name, email, hash, phone||null, safeRole, city||null]
    );
    const token = jwt.sign({ id: result.insertId, name, email, role: safeRole }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.insertId, name, email, role: safeRole, city } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email=? AND is_active=1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      SECRET, { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, city: user.city } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').auth, async (req, res) => {
  const [rows] = await db.query('SELECT id,name,email,phone,role,city,avatar,created_at FROM users WHERE id=?', [req.user.id]);
  res.json(rows[0] || {});
});

module.exports = router;
