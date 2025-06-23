// models/Service.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Service = sequelize.define('Service', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        service_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        service_prefix: {
            type: DataTypes.STRING(5),
            allowNull: false,
            unique: true,
        },
        estimated_duration_minutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 10,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
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
        tableName: 'services', // Pastikan ini sesuai dengan nama tabel Anda di DB
        timestamps: false,     // Karena kita mengelola created_at dan updated_at secara manual
        underscored: true,     // Jika nama kolom di DB menggunakan underscore (misal: service_name)
    });

    // Tidak ada asosiasi langsung di sini untuk saat ini, tapi akan ada dengan model Queue nantinya.
    // Service.associate = function(models) {
    //   Service.hasMany(models.Queue, { foreignKey: 'service_id', as: 'queues' });
    // };

    return Service;
};