const { Pool } = require('pg');
const { RESEARCH_ITEMS } = require('./data/researchItems');

const isProduction = process.env.NODE_ENV === 'production';
const isReplitDb =
  process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=disable');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isReplitDb ? false : isProduction ? { rejectUnauthorized: false } : false
});

async function initDb() {
  // Основная таблица с пунктами (как и раньше)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      day TEXT NOT NULL CHECK (day IN ('Понедельник','Вторник','Среда','Четверг','Пятница')),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Пользователи для авторизации и сохранения данных по исследованиям
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Справочник пунктов исследований (можно наполнить из Excel)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS research_items (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      max_level INTEGER NOT NULL DEFAULT 10 CHECK (max_level >= 1),
      power_per_level INTEGER NOT NULL CHECK (power_per_level >= 0),
      time_minutes INTEGER NOT NULL CHECK (time_minutes > 0),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Состояние пунктов исследований для конкретного пользователя
  await pool.query(`
    CREATE TABLE IF NOT EXISTS research_states (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      research_item_id INTEGER NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
      current_level INTEGER NOT NULL DEFAULT 0 CHECK (current_level >= 0),
      blocked BOOLEAN NOT NULL DEFAULT FALSE,
      power_per_level_override INTEGER,
      time_minutes_override INTEGER,
      UNIQUE(user_id, research_item_id)
    )
  `);

  // Автозаполнение research_items из JS-справочника, если таблица пуста
  await seedResearchItemsFromConfigIfEmpty();
}

async function seedResearchItemsFromConfigIfEmpty() {
  try {
    const countRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM research_items');
    const count = countRes.rows[0]?.cnt || 0;
    if (count > 0) {
      return;
    }

    if (!Array.isArray(RESEARCH_ITEMS) || RESEARCH_ITEMS.length === 0) {
      console.warn('RESEARCH_ITEMS пуст — заполните data/researchItems.js');
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of RESEARCH_ITEMS) {
        if (!item || !item.name) continue;
        const code = item.code || null;
        const maxLevel = Number.isFinite(item.maxLevel) ? item.maxLevel : 1;
        const powerPerLevel = Number.isFinite(item.powerPerLevel)
          ? item.powerPerLevel
          : 0;
        const timeMinutes = Number.isFinite(item.timeMinutes) ? item.timeMinutes : 1;

        if (maxLevel <= 0 || timeMinutes <= 0 || powerPerLevel < 0) continue;

        await client.query(
          `
          INSERT INTO research_items (code, name, max_level, power_per_level, time_minutes)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (code) DO NOTHING
        `,
          [code, item.name, maxLevel, powerPerLevel, timeMinutes]
        );
      }
      await client.query('COMMIT');
      console.log(
        'Импортировано записей в research_items из RESEARCH_ITEMS (новых по code)'
      );
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Ошибка при импорте research_items из RESEARCH_ITEMS:', err);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Общая ошибка автоимпорта research_items из RESEARCH_ITEMS:', err);
  }
}

module.exports = { pool, initDb };
