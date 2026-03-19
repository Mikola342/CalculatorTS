const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { password } = req.body;
  const adminHash = process.env.ADMIN_PASSWORD;

  if (!adminHash) {
    return res.status(500).json({ error: 'Пароль администратора не настроен' });
  }

  try {
    const ok = await bcrypt.compare(password, adminHash);
    if (ok) {
      req.session.isAdmin = true;
      res.json({ success: true, message: 'Вход выполнен' });
    } else {
      res.status(401).json({ error: 'Неверный пароль' });
    }
  } catch {
    res.status(500).json({ error: 'Ошибка проверки пароля' });
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
