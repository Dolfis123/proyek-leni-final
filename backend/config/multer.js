// config/multer.js
const multer = require("multer");
const path = require("path");

// Tentukan penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Tentukan folder tempat file akan disimpan
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    // Tentukan nama file yang unik
    const fileExt = path.extname(file.originalname);
    const fileName = `ktp_${Date.now()}${fileExt}`;
    cb(null, fileName);
  }
});

// Inisialisasi multer
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Cek apakah file adalah gambar
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Hanya gambar yang diperbolehkan"));
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // Maksimum ukuran file 2MB
});

module.exports = upload;
