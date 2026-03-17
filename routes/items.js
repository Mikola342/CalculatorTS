const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { day } = req.query;
    const result = day
      ? await pool.query('SELECT id, name, price, day, qty_divisor FROM items WHERE day = $1 ORDER BY id ASC', [day])
      : await pool.query('SELECT id, name, price, day, qty_divisor FROM items ORDER BY day ASC, id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, price, day } = req.body;
    if (!name || price == null || !day) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }
    const result = await pool.query(
      'INSERT INTO items (name, price, day) VALUES ($1, $2, $3) RETURNING *',
      [name, parseInt(price, 10), day]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, price, day } = req.body;
    const result = await pool.query(
      'UPDATE items SET name=$1, price=$2, day=$3 WHERE id=$4 RETURNING *',
      [name, parseInt(price, 10), day, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Элемент не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM items WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Элемент не найден' });
    res.json({ message: 'Удалено успешно' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
