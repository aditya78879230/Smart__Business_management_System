// payments.js
const router = require('express').Router();
const db     = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/my', auth, async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, b.booking_ref, s.name AS service_name
     FROM payments p JOIN bookings b ON p.booking_id=b.id
     JOIN services s ON b.service_id=s.id
     WHERE p.user_id=? ORDER BY p.created_at DESC`, [req.user.id]);
  res.json(rows);
});

router.get('/owner', ...requireRole('owner'), async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, b.booking_ref, u.name AS customer_name, s.name AS service_name
     FROM payments p JOIN bookings b ON p.booking_id=b.id
     JOIN services s ON b.service_id=s.id JOIN users u ON p.user_id=u.id
     WHERE s.owner_id=? ORDER BY p.created_at DESC`, [req.user.id]);
  res.json(rows);
});

router.patch('/:id/mark-paid', ...requireRole('owner'), async (req, res) => {
  const { method, transaction_ref, notes } = req.body;
  const today = new Date().toISOString().slice(0,10);
  const [pm] = await db.query(
    `SELECT p.* FROM payments p JOIN bookings b ON p.booking_id=b.id
     JOIN services s ON b.service_id=s.id WHERE p.id=? AND s.owner_id=?`,
    [req.params.id, req.user.id]);
  if (!pm.length) return res.status(403).json({ error: 'Not found' });
  await db.query(
    `UPDATE payments SET paid_amount=amount, pending_amount=0, status='paid',
     method=?, transaction_ref=?, notes=?, paid_date=? WHERE id=?`,
    [method||'cash', transaction_ref||null, notes||null, today, req.params.id]);
  await db.query(
    `INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'payment')`,
    [pm[0].user_id, '💳 Payment Confirmed', `Your payment of ₹${pm[0].amount} has been marked as received.`]);
  res.json({ message: 'Payment marked as paid' });
});

module.exports = router;
