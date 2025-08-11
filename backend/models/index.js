"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const db = {};

let sequelize;

// Inisialisasi koneksi Sequelize.
// Kode ini secara otomatis akan mengambil SEMUA konfigurasi dari config.js,
// termasuk username, password, host, dialect, dan timezone.
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// Membaca semua file model dari direktori ini secara otomatis
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// Menjalankan fungsi 'associate' untuk membuat relasi antar tabel
// jika fungsi tersebut ada di dalam definisi model.
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Menyimpan instance sequelize dan library Sequelize ke dalam objek db
// untuk digunakan di bagian lain dari aplikasi.
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Melakukan tes koneksi ke database saat aplikasi dimulai untuk memastikan
// kredensial dan konfigurasi sudah benar.
db.sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Koneksi Sequelize ke database berhasil!");
  })
  .catch((err) => {
    console.error("❌ Gagal terkoneksi ke database dengan Sequelize:", err);
  });

module.exports = db;
