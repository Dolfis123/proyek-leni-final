// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'rahasia_server_anda';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid' });

    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
