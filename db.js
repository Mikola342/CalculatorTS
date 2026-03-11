const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const isReplitDb = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=disable');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isReplitDb ? false : isProduction ? { rejectUnauthorized: false } : false
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      day TEXT NOT NULL CHECK (day IN ('Понедельник','Вторник','Среда','Четверг','Пятница')),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

module.exports = { pool, initDb };
