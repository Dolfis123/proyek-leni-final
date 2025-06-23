// models/OtpCode.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const OtpCode = sequelize.define('OtpCode', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        recipient_email: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        otp_code: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        is_used: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    }, {
        tableName: 'otp_codes', // Pastikan ini sesuai dengan nama tabel Anda di DB
        timestamps: false,      // Karena kita mengelola created_at secara manual
        underscored: true,      // Jika nama kolom di DB menggunakan underscore
    });

    // Tidak ada asosiasi langsung untuk OtpCode ke model lain untuk saat ini.
    // OtpCode.associate = function(models) {
    //   // define association here
    // };

    return OtpCode;
};