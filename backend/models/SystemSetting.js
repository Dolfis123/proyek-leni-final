// models/SystemSetting.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SystemSetting = sequelize.define('SystemSetting', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        setting_key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        setting_value: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
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
        tableName: 'system_settings', // Pastikan ini sesuai dengan nama tabel Anda di DB
        timestamps: false,           // Karena kita mengelola created_at dan updated_at secara manual
        underscored: true,           // Jika nama kolom di DB menggunakan underscore
    });

    return SystemSetting;
};