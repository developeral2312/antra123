const { Pool, Client } = require('pg');
const { parse } = require('pg-connection-string');
const bcrypt = require('bcryptjs');

const globalForPg = globalThis;

function getSchemaName() {
  const raw = (process.env.PGSCHEMA || '').trim();
  if (!raw) return '';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(raw)) {
    throw new Error(`Invalid PGSCHEMA name: "${raw}". Use only letters, numbers, and underscores.`);
  }
  return raw;
}

function getPoolConfig() {
  const schema = getSchemaName();
  const options = schema ? `-c search_path=${schema},public` : undefined;

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      options,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
    };
  }

  return {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'company_database',
    options
  };
}

async function ensureDatabaseExists(poolConfig) {
  const parsed = poolConfig.connectionString ? parse(poolConfig.connectionString) : poolConfig;
  const targetDb = (parsed.database || '').trim();
  if (!targetDb || !/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(targetDb)) {
    throw new Error(`Invalid PostgreSQL database name: "${targetDb}"`);
  }

  const adminClient = new Client({
    host: parsed.host || 'localhost',
    port: parseInt(parsed.port || '5432', 10),
    user: parsed.user || 'postgres',
    password: parsed.password,
    database: 'postgres',
    ssl: poolConfig.ssl
  });

  try {
    await adminClient.connect();
    await adminClient.query(`CREATE DATABASE "${targetDb}"`);
  } catch (err) {
    // 42P04 = database already exists (safe if created concurrently)
    if (err.code !== '42P04') {
      throw err;
    }
  } finally {
    await adminClient.end().catch(() => {});
  }
}

function getPool() {
  if (!globalForPg.__antraPgPool) {
    globalForPg.__antraPgPool = new Pool(getPoolConfig());
  }
  return globalForPg.__antraPgPool;
}

async function initSchema(pool) {
  const schema = getSchemaName();
  let client;

  try {
    client = await pool.connect();
  } catch (err) {
    // 3D000 = target database does not exist yet -> auto-create it
    if (err.code === '3D000') {
      await ensureDatabaseExists(getPoolConfig());
      client = await pool.connect();
    } else {
      throw err;
    }
  }

  try {
    if (schema) {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      await client.query(`SET search_path TO "${schema}", public`);
    }

    // 1. Customers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        customer_id TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        address TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 2. Orders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        customer_id TEXT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
        order_date TEXT NOT NULL,
        description TEXT,
        remarks TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // 3. Order Videos Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_videos (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        order_number TEXT NOT NULL,
        video_name TEXT NOT NULL,
        video_url TEXT,
        local_path TEXT,
        upload_status TEXT NOT NULL DEFAULT 'uploaded',
        file_size BIGINT DEFAULT 0,
        duration_seconds DOUBLE PRECISION DEFAULT 0,
        mime_type TEXT DEFAULT 'video/mp4',
        created_at TEXT NOT NULL
      );
    `);

    // 4. Admin Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TEXT NOT NULL
      );
    `);

    // 5. Activity Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        customer_id TEXT,
        order_number TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // 6. Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT NOT NULL
      );
    `);

    // Seed default admin if none exists
    const adminCheck = await client.query('SELECT COUNT(*)::int AS count FROM admin_users');
    if (adminCheck.rows[0].count === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('admin123', salt);
      const now = new Date().toISOString();

      await client.query(
        `INSERT INTO admin_users (email, password_hash, name, role, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin@antra.com', hash, 'Admin', 'admin', now]
      );

      await client.query(
        `INSERT INTO activity_logs (type, title, description, created_at)
         VALUES ($1, $2, $3, $4)`,
        ['system', 'Antra System Initialized', 'PostgreSQL database and system storage initialized successfully.', now]
      );
    }
  } finally {
    client.release();
  }
}

async function getDb() {
  const pool = getPool();
  if (!globalForPg.__antraPgInitPromise) {
    globalForPg.__antraPgInitPromise = initSchema(pool).catch((err) => {
      globalForPg.__antraPgInitPromise = null;
      throw err;
    });
  }
  await globalForPg.__antraPgInitPromise;
  return pool;
}

async function query(text, params = []) {
  const pool = await getDb();
  return pool.query(text, params);
}

module.exports = { getDb, getPool, query };
