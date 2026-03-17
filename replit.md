# VS Calculator

Node.js + Express приложение с фронтендом на чистом HTML/CSS/JS.

## Стек

- **Backend**: Node.js, Express, `pg` (PostgreSQL)
- **Frontend**: Vanilla HTML/CSS/JS (без фреймворков)
- **База данных**: Replit PostgreSQL (переменная `DATABASE_URL`)
- **Аутентификация**: express-session + bcrypt

## Структура

```
server.js          — точка входа, настройка Express
db.js              — пул подключений pg, инициализация таблиц и сидирование
routes/
  auth.js          — POST /api/auth/login, logout, GET /api/auth/status (admin)
  users.js         — POST /api/users/register, login, logout, GET /api/users/me
  items.js         — CRUD /api/items (пункты очков VS)
  research.js      — GET /api/research/items, GET/POST /api/research/state
  bonuses.js       — GET /api/bonuses (типы бонусов очков)
middleware/
  auth.js          — requireAdmin, requireUser
data/
  fallback.js      — начальные данные items
  researchItems.js — начальные данные research_items
  bonusFallback.js — начальные данные point_bonus_types
public/
  index.html/app.js/style.css — калькулятор очков VS
  research.html/research.js   — страница оптимизации исследований
seed.js            — ручной сброс и пересев items
```

## Таблицы БД

- `items` — пункты очков VS (name, price, day)
- `point_bonus_types` — типы бонусов (name, day)
- `users` — пользователи (username, password_hash)
- `research_items` — справочник исследований (code, name, max_level, power_per_level, time_minutes, group_name)
- `research_states` — состояние исследований пользователя (user_id, research_item_id, current_level, blocked, overrides)

## Переменные окружения

- `DATABASE_URL` — строка подключения к PostgreSQL (управляется Replit)
- `SESSION_SECRET` — секрет для express-session (управляется Replit)
- `ADMIN_PASSWORD` — пароль для входа в режим администратора (задаётся пользователем)
- `PORT` — порт сервера (по умолчанию 5000)

## Запуск

```
node server.js
```

`initDb()` при старте автоматически создаёт таблицы и сидирует данные если они пусты.
