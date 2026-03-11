const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

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
      UNIQUE(user_id, research_item_id)
    )
  `);

  // Автозаполнение research_items из Excel, если таблица пуста
  await seedResearchItemsFromExcelIfEmpty();
}

async function seedResearchItemsFromExcelIfEmpty() {
  try {
    const countRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM research_items');
    const count = countRes.rows[0]?.cnt || 0;
    if (count > 0) {
      return;
    }

    const excelPath = path.join(__dirname, 'пункты исследования.xlsx');
    if (!fs.existsSync(excelPath)) {
      console.warn(
        'Файл "пункты исследования.xlsx" не найден, автоимпорт research_items пропущен'
      );
      return;
    }

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      console.warn('В Excel-файле нет листов, автоимпорт research_items пропущен');
      return;
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length < 2) {
      console.warn('В Excel-файле недостаточно строк, автоимпорт research_items пропущен');
      return;
    }

    const dataRows = rows.slice(1); // пропускаем заголовок
    const items = [];

    for (const row of dataRows) {
      if (!row || row.length === 0) continue;

      // Ожидаемый формат строки: [code, name, max_level, power_per_level, time_minutes]
      const code = (row[0] ?? '').toString().trim() || null;
      const name = (row[1] ?? '').toString().trim();
      const maxLevel = parseInt(row[2], 10) || 0;
      const powerPerLevel = parseInt(row[3], 10) || 0;
      const timeMinutes = parseInt(row[4], 10) || 0;

      if (!name || maxLevel <= 0 || powerPerLevel < 0 || timeMinutes <= 0) {
        continue;
      }

      items.push({ code, name, maxLevel, powerPerLevel, timeMinutes });
    }

    if (!items.length) {
      console.warn(
        'Не удалось получить ни одной валидной строки из Excel, автоимпорт research_items пропущен'
      );
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        await client.query(
          `
          INSERT INTO research_items (code, name, max_level, power_per_level, time_minutes)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (code) DO NOTHING
        `,
          [item.code, item.name, item.maxLevel, item.powerPerLevel, item.timeMinutes]
        );
      }
      await client.query('COMMIT');
      console.log(
        `Импортировано записей в research_items из Excel (новых по code): ${items.length}`
      );
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Ошибка при импорте research_items из Excel:', err);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Общая ошибка автоимпорта research_items из Excel:', err);
  }
}

module.exports = { pool, initDb };
