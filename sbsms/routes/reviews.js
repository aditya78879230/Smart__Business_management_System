const router = require('express').Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/:service_id', async (req, res) => {
  const [rows] = await db.query(
    `SELECT r.*, IF(r.is_anonymous=1,'Anonymous',u.name) AS reviewer_name
     FROM reviews r JOIN users u ON r.user_id=u.id
     WHERE r.service_id=? ORDER BY r.created_at DESC`, [req.params.service_id]);
  res.json(rows);
});

router.post('/', auth, async (req, res) => {
  const { service_id, booking_id, rating, comment, is_anonymous } = req.body;
  const [exists] = await db.query(
    'SELECT id FROM reviews WHERE user_id=? AND service_id=?', [req.user.id, service_id]);
  if (exists.length) return res.status(409).json({ error: 'Already reviewed' });
  await db.query(
    `INSERT INTO reviews (user_id,service_id,booking_id,rating,comment,is_anonymous)
     VALUES (?,?,?,?,?,?)`,
    [req.user.id, service_id, booking_id||null, rating, comment||'', is_anonymous?1:0]);
  // Recalculate avg rating
  const [avg] = await db.query(
    'SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE service_id=?', [service_id]);
  await db.query(
    'UPDATE services SET avg_rating=?, total_reviews=? WHERE id=?',
    [avg[0].avg||0, avg[0].cnt||0, service_id]);
  res.json({ message: 'Review submitted' });
});

router.patch('/:id/reply', ...requireRole('owner'), async (req, res) => {
  await db.query('UPDATE reviews SET owner_reply=? WHERE id=?', [req.body.reply, req.params.id]);
  res.json({ message: 'Reply added' });
});

module.exports = router;
