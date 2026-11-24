const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'antra.sqlite');

let dbInstance = null;

function getDb() {
  if (dbInstance) return dbInstance;

  dbInstance = new Database(DB_PATH);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  initSchema(dbInstance);
  return dbInstance;
}

function initSchema(db) {
  // 1. Customers Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      address TEXT NOT NULL,
      google_drive_folder_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Orders Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      order_date TEXT NOT NULL,
      description TEXT,
      remarks TEXT,
      google_drive_folder_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
    );
  `);

  // 3. Order Videos Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      order_number TEXT NOT NULL,
      video_name TEXT NOT NULL,
      google_drive_file_id TEXT,
      video_url TEXT,
      local_path TEXT,
      upload_status TEXT NOT NULL DEFAULT 'uploaded',
      file_size INTEGER DEFAULT 0,
      duration_seconds REAL DEFAULT 0,
      mime_type TEXT DEFAULT 'video/mp4',
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // 4. Admin Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL
    );
  `);

  // 5. Activity Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      customer_id TEXT,
      order_number TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 6. Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed default admin if none exists
  const adminCheck = db.prepare('SELECT count(*) as count FROM admin_users').get();
  if (adminCheck.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    db.prepare(`
      INSERT INTO admin_users (email, password_hash, name, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin@antra.com', hash, 'Admin', 'admin', new Date().toISOString());

    // Also seed initial activity
    db.prepare(`
      INSERT INTO activity_logs (type, title, description, created_at)
      VALUES (?, ?, ?, ?)
    `).run('system', 'Antra System Initialized', 'Database and system storage initialized successfully.', new Date().toISOString());
  }

  // Seed default settings if empty
  const gdriveSetting = db.prepare('SELECT * FROM settings WHERE key = ?').get('google_drive_config');
  if (!gdriveSetting) {
    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `).run(
      'google_drive_config',
      JSON.stringify({
        enabled: false,
        auth_mode: 'oauth', // 'oauth' or 'service_account'
        client_id: '',
        client_secret: '',
        refresh_token: '',
        service_account_json: '',
        root_folder_name: 'CUSTOMER DATABASE',
        root_folder_id: '',
        status: 'disconnected'
      }),
      new Date().toISOString()
    );
  }
}

module.exports = { getDb };
