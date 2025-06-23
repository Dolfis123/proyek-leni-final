// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // Memastikan variabel lingkungan dimuat

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection - Ini hanya dijalankan sekali saat server start
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the database!');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err.message);
        // Penting: Jika ini gagal, aplikasi harusnya berhenti atau ada penanganan error.
        // process.exit(1); // Ini bisa Anda aktifkan untuk memastikan aplikasi mati jika DB gagal
    });

module.exports = pool; // <<< PASTIKAN BARIS INI ADA UNTUK MENGEKSPOR 'pool'