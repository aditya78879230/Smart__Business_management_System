const router = require('express').Router();
const db     = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/services — public listing with filters
router.get('/', async (req, res) => {
  const { city, category, search, sort } = req.query;
  let sql = `SELECT s.*, u.name AS owner_name FROM services s
             JOIN users u ON s.owner_id = u.id
             WHERE s.status = 'approved'`;
  const params = [];
  if (city)     { sql += ' AND s.city LIKE ?';     params.push(`%${city}%`); }
  if (category) { sql += ' AND s.category = ?';    params.push(category); }
  if (search)   { sql += ' AND (s.name LIKE ? OR s.description LIKE ?)'; params.push(`%${search}%`,`%${search}%`); }
  sql += sort === 'price'  ? ' ORDER BY s.price_monthly ASC'  :
         sort === 'rating' ? ' ORDER BY s.avg_rating DESC'     : ' ORDER BY s.created_at DESC';
  const [rows] = await db.query(sql, params);
  res.json(rows);
});

// GET /api/services/:id — single service detail
router.get('/:id', async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.*, u.name AS owner_name, u.phone AS owner_phone, u.email AS owner_email
     FROM services s JOIN users u ON s.owner_id = u.id WHERE s.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const svc = rows[0];
  // Fetch category-specific details
  let detail = {};
  if (svc.category === 'gym') {
    const [r] = await db.query('SELECT * FROM gym_details WHERE service_id=?', [svc.id]);
    detail = r[0] || {};
  } else if (svc.category === 'hostel') {
    const [r] = await db.query('SELECT * FROM hostel_details WHERE service_id=?', [svc.id]);
    detail = r[0] || {};
  } else if (svc.category === 'hotel') {
    const [r] = await db.query('SELECT * FROM hotel_details WHERE service_id=?', [svc.id]);
    detail = r[0] || {};
  } else if (svc.category === 'coaching') {
    const [r] = await db.query('SELECT * FROM coaching_details WHERE service_id=?', [svc.id]);
    detail = r[0] || {};
  }
  res.json({ ...svc, detail });
});

// POST /api/services — owner adds service
router.post('/', ...requireRole('owner'), async (req, res) => {
  const {
    name, category, description, city, address, phone, email,
    opening_time, closing_time, capacity, google_map,
    price_monthly, price_quarterly, price_halfyearly, price_yearly,
    facilities, images
  } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO services
       (owner_id,name,category,description,city,address,phone,email,
        opening_time,closing_time,capacity,google_map,
        price_monthly,price_quarterly,price_halfyearly,price_yearly,
        facilities,images,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
      [req.user.id, name, category, description, city, address, phone, email,
       opening_time, closing_time, capacity||0, google_map||null,
       price_monthly||null, price_quarterly||null, price_halfyearly||null, price_yearly||null,
       JSON.stringify(facilities||[]), JSON.stringify(images||[])]
    );
    // Insert category-specific detail
    if (category === 'gym' && req.body.gym) {
      const g = req.body.gym;
      await db.query(
        `INSERT INTO gym_details (service_id,trainer_count,trainer_names,equipment_list,batch_morning,batch_evening,personal_training,locker,shower)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [result.insertId, g.trainer_count||0, g.trainer_names||'', g.equipment_list||'',
         g.batch_morning||'', g.batch_evening||'', g.personal_training||0, g.locker||0, g.shower||0]
      );
    }
    if (category === 'hostel' && req.body.hostel) {
      const h = req.body.hostel;
      await db.query(
        `INSERT INTO hostel_details (service_id,room_types,total_rooms,available_rooms,food_facility,wifi,security,checkin_time,checkout_time,rules)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [result.insertId, h.room_types||'', h.total_rooms||0, h.available_rooms||0,
         h.food_facility||0, h.wifi||0, h.security||0, h.checkin_time||'', h.checkout_time||'', h.rules||'']
      );
    }
    if (category === 'hotel' && req.body.hotel) {
      const h = req.body.hotel;
      await db.query(
        `INSERT INTO hotel_details (service_id,room_types,total_rooms,available_rooms,price_per_night,ac,parking,room_service,checkin_time,checkout_time)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [result.insertId, h.room_types||'', h.total_rooms||0, h.available_rooms||0,
         h.price_per_night||0, h.ac||0, h.parking||0, h.room_service||0,
         h.checkin_time||'', h.checkout_time||'']
      );
    }
    if (category === 'coaching' && req.body.coaching) {
      const c = req.body.coaching;
      await db.query(
        `INSERT INTO coaching_details (service_id,subjects,faculty_names,batch_timing,exam_boards)
         VALUES (?,?,?,?,?)`,
        [result.insertId, c.subjects||'', c.faculty_names||'', c.batch_timing||'', c.exam_boards||'']
      );
    }
    // Notify admin
    const [admins] = await db.query(`SELECT id FROM users WHERE role='admin'`);
    for (const a of admins) {
      await db.query(
        `INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'approval')`,
        [a.id, 'New Service Pending Verification', `"${name}" submitted by owner — awaiting your review.`]
      );
    }
    res.json({ id: result.insertId, message: 'Service submitted for verification' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/services/categories/counts
router.get('/meta/counts', async (req, res) => {
  const [rows] = await db.query(
    `SELECT category, COUNT(*) AS total FROM services WHERE status='approved' GROUP BY category`
  );
  res.json(rows);
});

module.exports = router;
