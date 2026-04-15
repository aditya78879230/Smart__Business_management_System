const router = require('express').Router();
const db     = require('../db');
const { auth, requireRole } = require('../middleware/auth');

function refId() {
  return 'BK' + Date.now().toString(36).toUpperCase();
}

// POST /api/bookings — customer creates booking request
router.post('/', auth, async (req, res) => {
  const { service_id, plan, start_date, slot, special_request, amount } = req.body;
  try {
    const ref = refId();
    // Calculate end_date based on plan
    const starts = new Date(start_date);
    const days = { monthly:30, quarterly:90, halfyearly:180, yearly:365, per_night:1, per_person:1 };
    const ends = new Date(starts);
    ends.setDate(ends.getDate() + (days[plan] || 30));

    const [result] = await db.query(
      `INSERT INTO bookings (booking_ref,user_id,service_id,plan,start_date,end_date,slot,special_request,amount,status)
       VALUES (?,?,?,?,?,?,?,?,?,'pending')`,
      [ref, req.user.id, service_id, plan, start_date, ends.toISOString().slice(0,10),
       slot||null, special_request||null, amount||0]
    );
    // Notify owner
    const [svc] = await db.query('SELECT owner_id, name FROM services WHERE id=?', [service_id]);
    if (svc.length) {
      await db.query(
        `INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'booking')`,
        [svc[0].owner_id, 'New Booking Request',
         `${req.user.name} requested a booking for "${svc[0].name}" — Ref: ${ref}`]
      );
    }
    res.json({ id: result.insertId, booking_ref: ref, message: 'Request submitted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/bookings/my — customer's own bookings
router.get('/my', auth, async (req, res) => {
  const [rows] = await db.query(
    `SELECT b.*, s.name AS service_name, s.category, s.city
     FROM bookings b JOIN services s ON b.service_id = s.id
     WHERE b.user_id = ? ORDER BY b.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// GET /api/bookings/owner — all bookings for owner's services
router.get('/owner', ...requireRole('owner'), async (req, res) => {
  const [rows] = await db.query(
    `SELECT b.*, s.name AS service_name, u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email
     FROM bookings b
     JOIN services s ON b.service_id = s.id
     JOIN users u ON b.user_id = u.id
     WHERE s.owner_id = ? ORDER BY b.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// PATCH /api/bookings/:id/status — owner approves/rejects
router.patch('/:id/status', ...requireRole('owner'), async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  const [bk] = await db.query(
    `SELECT b.*, s.owner_id, s.name AS sname FROM bookings b
     JOIN services s ON b.service_id = s.id WHERE b.id=?`, [req.params.id]
  );
  if (!bk.length || bk[0].owner_id !== req.user.id)
    return res.status(403).json({ error: 'Not your booking' });
  await db.query('UPDATE bookings SET status=? WHERE id=?', [status, req.params.id]);
  // If approved, create payment record
  if (status === 'approved') {
    const due = new Date(); due.setDate(due.getDate() + 7);
    await db.query(
      `INSERT INTO payments (booking_id,user_id,amount,paid_amount,pending_amount,status,due_date)
       VALUES (?,?,?,0,?,'pending',?)`,
      [req.params.id, bk[0].user_id, bk[0].amount, bk[0].amount, due.toISOString().slice(0,10)]
    );
  }
  // Notify customer
  await db.query(
    `INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'booking')`,
    [bk[0].user_id,
     status === 'approved' ? '✅ Booking Approved!' : '❌ Booking Rejected',
     `Your booking for "${bk[0].sname}" (${bk[0].booking_ref}) has been ${status}.`]
  );
  res.json({ message: `Booking ${status}` });
});

module.exports = router;
