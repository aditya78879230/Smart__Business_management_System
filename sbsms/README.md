# 🏢 SBSMS — Smart Business Service Management System

A full-stack real-world web application for managing services like Gyms, Hostels,
Hotels, Restaurants, and Coaching Institutes with booking, payment tracking,
role-based dashboards, reviews, and automated notifications.

---

## 🔧 TECH STACK

| Layer      | Technology               |
|------------|--------------------------|
| Backend    | Node.js + Express.js     |
| Frontend   | HTML5 + CSS3 + Vanilla JS|
| Database   | MySQL                    |
| Auth       | JWT (JSON Web Tokens)    |
| Passwords  | bcryptjs (hashed)        |
| Emails     | Nodemailer (SMTP ready)  |

---

## 🚀 HOW TO RUN (Step-by-Step)

### Step 1 — Install MySQL
Download MySQL from https://dev.mysql.com/downloads/
Or use XAMPP: https://www.apachefriends.org/

### Step 2 — Setup Database
1. Open MySQL Workbench or phpMyAdmin
2. Open the file: `database.sql`
3. Run it (Ctrl+Enter or Execute button)
4. This creates the `sbsms_db` database with all tables + an admin user

### Step 3 — Configure Environment
Edit `.env` file:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password   ← put your MySQL password here
DB_NAME=sbsms_db
JWT_SECRET=sbsms_super_secret_key_2025
PORT=3000
```

### Step 4 — Install Dependencies
Open terminal in the project folder and run:
```bash
npm install
```

### Step 5 — Start the Server
```bash
node server.js
```
You will see: ✅ SBSMS running on http://localhost:3000

### Step 6 — Open in Browser
Go to: http://localhost:3000

---

## 👤 DEFAULT LOGIN

| Role  | Email              | Password  |
|-------|--------------------|-----------|
| Admin | admin@sbsms.com    | admin123  |

You can register new Owner and Customer accounts from the Register tab.

---

## 📁 PROJECT STRUCTURE

```
sbsms/
├── server.js              ← Main Express server
├── db.js                  ← MySQL database connection
├── database.sql           ← SQL schema + seed data
├── .env                   ← Environment config
├── package.json           ← Dependencies
│
├── middleware/
│   └── auth.js            ← JWT authentication middleware
│
├── routes/
│   ├── auth.js            ← Register, Login, Profile
│   ├── services.js        ← Service CRUD + listing
│   ├── bookings.js        ← Booking request workflow
│   ├── payments.js        ← Payment tracking
│   ├── reviews.js         ← Ratings and reviews
│   ├── admin.js           ← Admin panel routes
│   └── owner.js           ← Owner dashboard routes
│
└── public/
    ├── index.html         ← Complete SPA frontend
    └── uploads/           ← Image upload folder
```

---

## 🗄️ DATABASE TABLES

| Table             | Purpose                                |
|-------------------|----------------------------------------|
| users             | All users (Admin / Owner / Customer)   |
| services          | All business listings                  |
| gym_details       | Gym-specific data                      |
| hostel_details    | Hostel-specific data                   |
| hotel_details     | Hotel-specific data                    |
| coaching_details  | Coaching class data                    |
| bookings          | Booking requests & status              |
| payments          | Payment records & tracking             |
| reviews           | Star ratings & comments                |
| notifications     | System alerts & reminders              |

---

## 🔗 API ENDPOINTS

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/me

### Services (Public)
- GET  /api/services              → List with filters
- GET  /api/services/:id          → Single service detail
- POST /api/services              → Owner adds service

### Bookings
- POST  /api/bookings             → Customer books
- GET   /api/bookings/my          → Customer's bookings
- GET   /api/bookings/owner       → Owner's incoming bookings
- PATCH /api/bookings/:id/status  → Owner approve/reject

### Payments
- GET   /api/payments/my          → Customer's payments
- GET   /api/payments/owner       → Owner's payment ledger
- PATCH /api/payments/:id/mark-paid → Owner marks as paid

### Reviews
- GET  /api/reviews/:service_id   → Get all reviews
- POST /api/reviews               → Submit a review

### Admin
- GET  /api/admin/dashboard
- GET  /api/admin/services
- PATCH /api/admin/services/:id/status
- GET  /api/admin/users
- PATCH /api/admin/users/:id/toggle

---

## 🎯 ROLES & ACCESS

| Feature              | Admin | Owner | Customer |
|----------------------|-------|-------|----------|
| Verify businesses    | ✅    | ❌    | ❌       |
| Add services         | ❌    | ✅    | ❌       |
| Approve bookings     | ❌    | ✅    | ❌       |
| Update payments      | ❌    | ✅    | ❌       |
| Book services        | ❌    | ❌    | ✅       |
| Write reviews        | ❌    | ❌    | ✅       |
| View all users       | ✅    | ❌    | ❌       |

---

## 📌 VIVA ANSWER

> "This system is a full-stack Node.js + MySQL web application implementing
> role-based access control with JWT authentication. It follows a
> request-gated workflow: owners submit services → admin verifies →
> customers book → owners approve → payments tracked. All data flows
> through REST APIs with bcrypt password hashing and automated
> notification system."
