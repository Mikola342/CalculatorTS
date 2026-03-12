const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// Список типов бонусов очков (названия), проценты вводятся на клиенте
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, day FROM point_bonus_types ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения point_bonus_types:', err);
    res.status(500).json({ error: 'Ошибка загрузки бонусов' });
  }
});

module.exports = router;

