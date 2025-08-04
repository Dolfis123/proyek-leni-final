// routes/userRoutes.js
const express = require('express');
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticateToken, authorizeRoles('super_admin'), getAllUsers);
router.post('/registrasi', authenticateToken, authorizeRoles('super_admin'), createUser);
router.put('/:id', authenticateToken, authorizeRoles('super_admin'), updateUser);
router.delete('/:id', authenticateToken, authorizeRoles('super_admin'), deleteUser);

module.exports = router;