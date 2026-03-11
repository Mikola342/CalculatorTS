require("dotenv").config();
const { pool, initDb } = require("./db");
const { FALLBACK_ITEMS } = require("./data/fallback");

async function seed() {
  try {
    await initDb();
    await pool.query("DELETE FROM items");
    for (const item of FALLBACK_ITEMS) {
      await pool.query(
        "INSERT INTO items (name, price, day) VALUES ($1, $2, $3)",
        [item.name, item.price, item.day],
      );
    }
    console.log(`Добавлено ${FALLBACK_ITEMS.length} элементов`);
    await pool.end();
  } catch (err) {
    console.error("Ошибка:", err.message);
    process.exit(1);
  }
}

seed();
