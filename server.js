require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Нужен для корректной работы secure-cookie (session) за прокси, например на Render
  app.set('trust proxy', 1);
}

app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.ADMIN_PASSWORD || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

const itemsRouter = require('./routes/items');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const researchRouter = require('./routes/research');
const bonusesRouter = require('./routes/bonuses');

app.use('/api/items', itemsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/research', researchRouter);
app.use('/api/bonuses', bonusesRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  try {
    await initDb();
    console.log('База данных инициализирована');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  } catch (err) {
    console.error('Ошибка запуска:', err.message);
    process.exit(1);
  }
}

start();
