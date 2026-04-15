const router = require('express').Router();
const db = require('../db');
const { requireRole } = require('../middleware/auth');
const guard = requireRole('admin');

router.get('/dashboard', ...guard, async (req, res) => {
  const [[users]]    = await db.query('SELECT COUNT(*) AS c FROM users WHERE role="customer"');
  const [[owners]]   = await db.query('SELECT COUNT(*) AS c FROM users WHERE role="owner"');
  const [[pending]]  = await db.query('SELECT COUNT(*) AS c FROM services WHERE status="pending"');
  const [[approved]] = await db.query('SELECT COUNT(*) AS c FROM services WHERE status="approved"');
  const [[revenue]]  = await db.query('SELECT SUM(paid_amount) AS c FROM payments WHERE status="paid"');
  const [cats]       = await db.query('SELECT category, COUNT(*) AS n FROM services WHERE status="approved" GROUP BY category');
  res.json({ customers: users.c, owners: owners.c, pending: pending.c, approved: approved.c,
             revenue: revenue.c||0, categories: cats });
});

router.get('/services', ...guard, async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.*, u.name AS owner_name FROM services s JOIN users u ON s.owner_id=u.id ORDER BY s.created_at DESC`);
  res.json(rows);
});

router.patch('/services/:id/status', ...guard, async (req, res) => {
  const { status } = req.body;
  await db.query('UPDATE services SET status=? WHERE id=?', [status, req.params.id]);
  const [svc] = await db.query('SELECT owner_id, name FROM services WHERE id=?', [req.params.id]);
  if (svc.length) {
    await db.query(
      `INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'approval')`,
      [svc[0].owner_id,
       status==='approved' ? '✅ Service Approved!' : '❌ Service Rejected',
       `Your service "${svc[0].name}" has been ${status} by the admin.`]);
  }
  res.json({ message: `Service ${status}` });
});

router.get('/users', ...guard, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id,name,email,phone,role,city,is_active,created_at FROM users ORDER BY created_at DESC');
  res.json(rows);
});

router.patch('/users/:id/toggle', ...guard, async (req, res) => {
  await db.query('UPDATE users SET is_active = NOT is_active WHERE id=?', [req.params.id]);
  res.json({ message: 'User status toggled' });
});

module.exports = router;
