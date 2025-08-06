// routes/authRoutes.js
const express = require("express");
const { login, createSuperAdmin } = require("../controllers/authController");
const { authenticateToken, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

router.post("/login", login);
router.post("/super-admin", createSuperAdmin); // Ingat untuk mengamankan/menghapus ini setelah SA pertama dibuat

module.exports = router;
