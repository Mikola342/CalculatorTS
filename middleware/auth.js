function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.status(401).json({ error: 'Требуется авторизация администратора' });
}

function requireUser(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Требуется авторизация пользователя' });
}

module.exports = { requireAdmin, requireUser };

