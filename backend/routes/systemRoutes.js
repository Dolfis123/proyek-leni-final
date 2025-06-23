// routes/systemRoutes.js
const express = require('express');
const {
    getAllSettings, setSetting, deleteSetting,
    getAllHolidays, createHoliday, updateHoliday, deleteHoliday
} = require('../controllers/systemController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

// Routes untuk System Settings (hanya Super Admin)
router.get('/settings', authenticateToken, authorizeRoles('super_admin'), getAllSettings);
router.post('/settings', authenticateToken, authorizeRoles('super_admin'), setSetting);
router.delete('/settings/:key', authenticateToken, authorizeRoles('super_admin'), deleteSetting);

// Routes untuk Holidays (hanya Super Admin)
router.get('/holidays', authenticateToken, authorizeRoles('super_admin'), getAllHolidays);
router.post('/holidays', authenticateToken, authorizeRoles('super_admin'), createHoliday);
router.put('/holidays/:id', authenticateToken, authorizeRoles('super_admin'), updateHoliday);
router.delete('/holidays/:id', authenticateToken, authorizeRoles('super_admin'), deleteHoliday);

module.exports = router;