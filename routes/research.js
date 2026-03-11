const express = require('express');
const { pool } = require('../db');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

// Все пункты исследований (справочник). Можно наполнять из Excel вручную/скриптом.
router.get('/items', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, code, name, max_level, power_per_level, time_minutes, group_name FROM research_items ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения research_items:', err);
    res.status(500).json({ error: 'Ошибка загрузки пунктов исследований' });
  }
});

// Состояние пунктов для текущего пользователя
router.get('/state', requireUser, async (req, res) => {
  try {
    const userId = req.session.userId;
    const result = await pool.query(
      `
      SELECT
        rs.id,
        rs.research_item_id,
        rs.current_level,
        rs.blocked,
        rs.power_per_level_override,
        rs.time_minutes_override
      FROM research_states rs
      WHERE rs.user_id = $1
      ORDER BY rs.research_item_id ASC
    `,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения research_state:', err);
    res.status(500).json({ error: 'Ошибка загрузки состояния исследований' });
  }
});

// Сохранение состояния пунктов исследований для пользователя
router.post('/state', requireUser, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Ожидается массив items' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of items) {
        const {
          researchItemId,
          currentLevel,
          blocked,
          powerPerLevel,
          timeMinutes
        } = item || {};

        if (!researchItemId || currentLevel == null) {
          continue;
        }

        const level = Math.max(0, parseInt(currentLevel, 10) || 0);
        const isBlocked = !!blocked;
        const powerOverride =
          powerPerLevel != null ? Math.max(0, parseInt(powerPerLevel, 10) || 0) : null;
        const timeOverride =
          timeMinutes != null ? Math.max(1, parseInt(timeMinutes, 10) || 1) : null;

        await client.query(
          `
          INSERT INTO research_states (
            user_id,
            research_item_id,
            current_level,
            blocked,
            power_per_level_override,
            time_minutes_override
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id, research_item_id)
          DO UPDATE SET
            current_level = EXCLUDED.current_level,
            blocked = EXCLUDED.blocked,
            power_per_level_override = EXCLUDED.power_per_level_override,
            time_minutes_override = EXCLUDED.time_minutes_override
        `,
          [userId, researchItemId, level, isBlocked, powerOverride, timeOverride]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка сохранения research_state:', err);
    res.status(500).json({ error: 'Ошибка сохранения состояния исследований' });
  }
});

module.exports = router;

