const router = require('express').Router();
const db = require('../db');
const { requireRole } = require('../middleware/auth');

router.get('/dashboard', ...requireRole('owner'), async (req, res) => {
  const oid = req.user.id;
  const [[svcs]]     = await db.query('SELECT COUNT(*) AS c FROM services WHERE owner_id=?', [oid]);
  const [[clients]]  = await db.query(
    `SELECT COUNT(DISTINCT b.user_id) AS c FROM bookings b
     JOIN services s ON b.service_id=s.id WHERE s.owner_id=? AND b.status='approved'`, [oid]);
  const [[revenue]]  = await db.query(
    `SELECT SUM(p.paid_amount) AS c FROM payments p
     JOIN bookings b ON p.booking_id=b.id
     JOIN services s ON b.service_id=s.id WHERE s.owner_id=?`, [oid]);
  const [[pending_pay]] = await db.query(
    `SELECT SUM(p.pending_amount) AS c FROM payments p
     JOIN bookings b ON p.booking_id=b.id
     JOIN services s ON b.service_id=s.id WHERE s.owner_id=?`, [oid]);
  const [[pending_bk]]  = await db.query(
    `SELECT COUNT(*) AS c FROM bookings b JOIN services s ON b.service_id=s.id
     WHERE s.owner_id=? AND b.status='pending'`, [oid]);
  res.json({
    services: svcs.c, clients: clients.c,
    revenue: revenue.c||0, pending_payments: pending_pay.c||0, pending_bookings: pending_bk.c
  });
});

router.get('/notifications', ...requireRole('owner','customer','admin'), async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20', [req.user.id]);
  res.json(rows);
});

router.patch('/notifications/read', ...requireRole('owner','customer','admin'), async (req, res) => {
  await db.query('UPDATE notifications SET is_read=1 WHERE user_id=?', [req.user.id]);
  res.json({ message: 'Marked read' });
});

module.exports = router;
