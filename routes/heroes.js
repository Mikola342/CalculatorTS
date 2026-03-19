const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireUser } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, rarity FROM heroes ORDER BY CASE rarity WHEN 'SSR' THEN 1 WHEN 'SR' THEN 2 WHEN 'R' THEN 3 END, id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/fragment-costs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT stars, rank, cost FROM fragment_costs ORDER BY stars ASC, rank ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/state', requireUser, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT hero_id, stars, rank, fragments FROM hero_fragments WHERE user_id = $1',
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/state', requireUser, async (req, res) => {
  try {
    const entries = req.body;
    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'Ожидается массив записей' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const entry of entries) {
        const { heroId, stars, rank, fragments } = entry;
        if (
          !Number.isInteger(heroId) ||
          !Number.isInteger(stars) || stars < 0 || stars > 9 ||
          !Number.isInteger(rank)  || rank  < 0 || rank  > 5 ||
          !Number.isInteger(fragments) || fragments < 0
        ) continue;

        await client.query(
          `INSERT INTO hero_fragments (user_id, hero_id, stars, rank, fragments)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, hero_id)
           DO UPDATE SET stars = $3, rank = $4, fragments = $5`,
          [req.session.userId, heroId, stars, rank, fragments]
        );
      }
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
