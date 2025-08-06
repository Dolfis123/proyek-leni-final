// routes/queueRoutes.js
const express = require("express");
const {
  checkOperationalStatus,
  requestOtp,
  verifyOtpAndCreateQueue,
  getPublicQueueStatus,
  getMyQueueStatus,
  requeueMissed,
  getQueuesForAdmin,
  callNextQueue,
  markQueueStatus,
  recallLastCalledQueue,
  getQueueReport,
} = require("../controllers/queueController");
const { authenticateToken, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

// --- Public Routes (Untuk Pengguna Website) ---
// Middleware checkOperationalStatus diterapkan untuk semua rute publik yang memengaruhi pendaftaran
router.post("/request-otp", checkOperationalStatus, requestOtp);
router.post(
  "/verify-otp-and-create",
  checkOperationalStatus,
  verifyOtpAndCreateQueue
);
router.get("/status/public", getPublicQueueStatus);
router.get("/status/my-queue", getMyQueueStatus);
router.post("/requeue-missed", checkOperationalStatus, requeueMissed);

// --- Admin Routes (Untuk Staf Pengadilan) ---
// Middleware authenticateToken dan authorizeRoles diterapkan
router.get(
  "/admin/:serviceId",
  authenticateToken,
  authorizeRoles("admin", "super_admin"),
  getQueuesForAdmin
);
router.post(
  "/admin/:serviceId/call-next",
  authenticateToken,
  authorizeRoles("admin", "super_admin"),
  callNextQueue
);
router.put(
  "/admin/:queueId/mark-status",
  authenticateToken,
  authorizeRoles("admin", "super_admin"),
  markQueueStatus
);
router.post(
  "/admin/:serviceId/recall-last",
  authenticateToken,
  authorizeRoles("admin", "super_admin"),
  recallLastCalledQueue
);

// --- Super Admin Routes (Untuk Laporan) ---
router.get(
  "/reports",
  authenticateToken,
  authorizeRoles("super_admin"),
  getQueueReport
);

module.exports = router;
