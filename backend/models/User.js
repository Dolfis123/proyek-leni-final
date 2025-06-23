// models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs'); // Untuk hashing password

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        full_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(100),
            unique: true,
            allowNull: true, // Ubah ke false jika email wajib
        },
        phone_number: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        role: {
            type: DataTypes.ENUM('super_admin', 'admin'),
            allowNull: false,
            defaultValue: 'admin',
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            onUpdate: DataTypes.NOW,
        },
    }, {
        tableName: 'users', // Pastikan nama tabel di DB
        timestamps: false, // Karena kita sudah mengelola created_at dan updated_at secara manual
        underscored: true, // Jika nama kolom di DB menggunakan underscore (misal: password_hash)
        hooks: {
            beforeCreate: async (user) => {
                if (user.password_hash) {
                    user.password_hash = await bcrypt.hash(user.password_hash, 10);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password_hash') && user.password_hash) {
                    user.password_hash = await bcrypt.hash(user.password_hash, 10);
                }
            },
        },
    });

    // Metode instance untuk membandingkan password
    User.prototype.validPassword = async function(password) {
        return await bcrypt.compare(password, this.password_hash);
    };

    return User;
};