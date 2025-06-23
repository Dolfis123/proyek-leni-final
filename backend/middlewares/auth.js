// middlewares/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Ambil token dari header 'Bearer TOKEN'

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Menambahkan payload user ke objek request
        next(); // Lanjutkan ke route handler
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token.' });
    }
};

// Middleware otorisasi berdasarkan peran
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access denied. User role not found.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied. Requires one of the following roles: ${roles.join(', ')}.` });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRoles };