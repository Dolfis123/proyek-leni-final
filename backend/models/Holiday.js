// models/Holiday.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Holiday = sequelize.define('Holiday', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        holiday_date: {
            type: DataTypes.DATEONLY, // DATEONLY untuk hanya menyimpan tanggal (YYYY-MM-DD)
            allowNull: false,
            unique: true,
        },
        holiday_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        is_recurring: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
        tableName: 'holidays', // Pastikan ini sesuai dengan nama tabel Anda di DB
        timestamps: false,     // Karena kita mengelola created_at dan updated_at secara manual
        underscored: true,     // Jika nama kolom di DB menggunakan underscore
    });

    return Holiday;
};