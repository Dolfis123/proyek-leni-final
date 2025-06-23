// controllers/authController.js
const db = require('../models'); // Mengimpor semua model Sequelize dari models/index.js
const User = db.User; // Mengambil model User
const jwt = require('jsonwebtoken');
require('dotenv').config();

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // Cari user berdasarkan username menggunakan Sequelize
        const user = await User.findOne({ where: { username: username } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // Bandingkan password menggunakan metode instance dari model User
        const isPasswordValid = await user.validPassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        if (!user.is_active) {
            return res.status(403).json({ message: 'Your account is inactive. Please contact administrator.' });
        }

        // Jika otentikasi berhasil, buat JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token berlaku 1 jam
        );

        res.status(200).json({ message: 'Login successful', token, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
};

// Fungsi untuk membuat super admin pertama kali (hanya dijalankan manual/sekali)
const createSuperAdmin = async (req, res) => {
    const { username, password, full_name, email } = req.body;

    if (!username || !password || !full_name || !email) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Cek apakah user sudah ada
        const existingUser = await User.findOne({ where: { username: username } });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        // Buat user baru menggunakan Sequelize
        const newUser = await User.create({
            username: username,
            password_hash: password, // Password akan di-hash oleh hooks beforeCreate di model
            full_name: full_name,
            email: email,
            role: 'super_admin'
        });

        res.status(201).json({ message: 'Super Admin created successfully!', user: newUser });
    } catch (error) {
        console.error('Error creating super admin:', error);
        res.status(500).json({ message: 'Error creating super admin.' });
    }
};

module.exports = { login, createSuperAdmin };