-- ============================================================
-- SMART BUSINESS SERVICE MANAGEMENT SYSTEM — DATABASE SCHEMA
-- Run this file in MySQL Workbench or phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS sbsms_db;
USE sbsms_db;

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  phone       VARCHAR(20),
  role        ENUM('admin','owner','customer') DEFAULT 'customer',
  avatar      VARCHAR(255),
  city        VARCHAR(80),
  is_active   TINYINT(1)    DEFAULT 1,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ─── SERVICES (master) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  owner_id      INT NOT NULL,
  name          VARCHAR(150) NOT NULL,
  category      ENUM('gym','hostel','hotel','restaurant','coaching') NOT NULL,
  description   TEXT,
  city          VARCHAR(80),
  address       TEXT,
  phone         VARCHAR(20),
  email         VARCHAR(150),
  opening_time  VARCHAR(20),
  closing_time  VARCHAR(20),
  capacity      INT DEFAULT 0,
  price_monthly     DECIMAL(10,2),
  price_quarterly   DECIMAL(10,2),
  price_halfyearly  DECIMAL(10,2),
  price_yearly      DECIMAL(10,2),
  facilities    TEXT,          -- JSON array of strings
  images        TEXT,          -- JSON array of file paths
  google_map    VARCHAR(500),
  status        ENUM('pending','approved','rejected') DEFAULT 'pending',
  avg_rating    DECIMAL(3,2)   DEFAULT 0.00,
  total_reviews INT            DEFAULT 0,
  created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── GYM DETAILS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gym_details (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  service_id      INT NOT NULL UNIQUE,
  trainer_count   INT DEFAULT 0,
  trainer_names   TEXT,
  equipment_list  TEXT,
  batch_morning   VARCHAR(50),
  batch_evening   VARCHAR(50),
  personal_training TINYINT(1) DEFAULT 0,
  locker          TINYINT(1) DEFAULT 0,
  shower          TINYINT(1) DEFAULT 0,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- ─── HOSTEL DETAILS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostel_details (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  service_id      INT NOT NULL UNIQUE,
  room_types      TEXT,       -- e.g. "Single,Double,Sharing"
  total_rooms     INT DEFAULT 0,
  available_rooms INT DEFAULT 0,
  food_facility   TINYINT(1) DEFAULT 0,
  wifi            TINYINT(1) DEFAULT 0,
  security        TINYINT(1) DEFAULT 0,
  checkin_time    VARCHAR(20),
  checkout_time   VARCHAR(20),
  rules           TEXT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- ─── HOTEL DETAILS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hotel_details (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  service_id      INT NOT NULL UNIQUE,
  room_types      TEXT,
  total_rooms     INT DEFAULT 0,
  available_rooms INT DEFAULT 0,
  price_per_night DECIMAL(10,2),
  ac              TINYINT(1) DEFAULT 0,
  parking         TINYINT(1) DEFAULT 0,
  room_service    TINYINT(1) DEFAULT 0,
  checkin_time    VARCHAR(20),
  checkout_time   VARCHAR(20),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- ─── COACHING DETAILS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_details (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  service_id      INT NOT NULL UNIQUE,
  subjects        TEXT,
  faculty_names   TEXT,
  batch_timing    TEXT,
  exam_boards     VARCHAR(100),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- ─── BOOKINGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  booking_ref     VARCHAR(20) NOT NULL UNIQUE,
  user_id         INT NOT NULL,
  service_id      INT NOT NULL,
  plan            ENUM('monthly','quarterly','halfyearly','yearly','per_night','per_person') NOT NULL,
  start_date      DATE,
  end_date        DATE,
  slot            VARCHAR(50),
  special_request TEXT,
  amount          DECIMAL(10,2),
  status          ENUM('pending','approved','rejected','completed','cancelled') DEFAULT 'pending',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- ─── PAYMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  booking_id      INT NOT NULL,
  user_id         INT NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  paid_amount     DECIMAL(10,2) DEFAULT 0,
  pending_amount  DECIMAL(10,2),
  method          ENUM('cash','upi','online','razorpay') DEFAULT 'cash',
  status          ENUM('pending','paid','partial','overdue') DEFAULT 'pending',
  due_date        DATE,
  paid_date       DATE,
  transaction_ref VARCHAR(100),
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- ─── REVIEWS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  service_id  INT NOT NULL,
  booking_id  INT,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_anonymous TINYINT(1) DEFAULT 0,
  owner_reply TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  title       VARCHAR(200),
  message     TEXT,
  type        ENUM('booking','payment','reminder','approval','system') DEFAULT 'system',
  is_read     TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── SEED ADMIN USER ─────────────────────────────────────────
-- Password: admin123 (bcrypt hash)
INSERT IGNORE INTO users (name, email, password, role, is_active)
VALUES ('Super Admin', 'admin@sbsms.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);
