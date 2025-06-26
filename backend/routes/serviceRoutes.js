// routes/serviceRoutes.js
const express = require('express');
const { getActiveServicesPublic , getAllServices, createService, updateService, deleteService } = require('../controllers/serviceController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

// Public route: Mendapatkan daftar layanan aktif untuk pendaftaran antrian
router.get('/active', getActiveServicesPublic );

// Admin/Super Admin routes: Manajemen layanan
router.get('/', authenticateToken, authorizeRoles('admin', 'super_admin'), getAllServices);
router.post('/', authenticateToken, authorizeRoles('super_admin'), createService);
router.put('/:id', authenticateToken, authorizeRoles('super_admin'), updateService);
router.delete('/:id', authenticateToken, authorizeRoles('super_admin'), deleteService);

module.exports = router;