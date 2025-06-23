const jwt = require("jsonwebtoken");

// Autentikasi token JWT
exports.verifyToken = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token tidak tersedia" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token tidak valid" });
  }
};

// Hanya super_admin yang bisa akses
exports.isSuperAdmin = (req, res, next) => {
  if (req.admin.role !== "super_admin") {
    return res.status(403).json({ message: "Akses ditolak: hanya untuk super admin" });
  }
  next();
};

// Untuk semua admin (staff atau super_admin)
exports.isAdmin = (req, res, next) => {
  const allowed = ["super_admin", "staff"];
  if (!allowed.includes(req.admin.role)) {
    return res.status(403).json({ message: "Akses ditolak: bukan admin" });
  }
  next();
};
