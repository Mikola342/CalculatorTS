const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');

const router = express.Router();

// Регистрация нового пользователя
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Укажите логин и пароль' });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Логин должен быть от 3 до 50 символов' });
    }

    if (password.length < 4 || password.length > 100) {
      return res
        .status(400)
        .json({ error: 'Пароль должен быть от 4 до 100 символов' });
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Пользователь с таким логином уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, passwordHash]
    );

    const user = result.rows[0];
    req.session.userId = user.id;

    res.status(201).json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// Вход пользователя
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Укажите логин и пароль' });
    }

    const result = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    req.session.userId = user.id;
    res.json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// Выход пользователя
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Текущий пользователь
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ user: null });
    }

    const result = await pool.query(
      'SELECT id, username FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ user: null });
    }

    const user = result.rows[0];
    res.json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Ошибка получения пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;

