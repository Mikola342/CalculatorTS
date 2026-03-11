const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'Пароль администратора не настроен' });
  }

  if (password === adminPassword) {
    req.session.isAdmin = true;
    res.json({ success: true, message: 'Вход выполнен' });
  } else {
    res.status(401).json({ error: 'Неверный пароль' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Выход выполнен' });
  });
});

router.get('/status', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

module.exports = router;
