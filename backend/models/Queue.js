// models/Queue.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Queue = sequelize.define(
    "Queue",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // References model Service (akan didefinisikan di fungsi associate)
      },
      queue_date: {
        type: DataTypes.DATEONLY, // Hanya tanggal (YYYY-MM-DD)
        allowNull: false,
      },
      queue_number_daily: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      full_queue_number: {
        type: DataTypes.STRING(20),
        allowNull: false, // <-- Biarkan seperti ini
      },
      customer_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      customer_email: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      customer_phone_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "pending_otp",
          "waiting",
          "calling",
          "completed",
          "missed",
          "recalled",
          "on_hold",
          "expired"
        ),
        allowNull: false,
        defaultValue: "pending_otp",
      },
      otp_verified_at: {
        type: DataTypes.DATE,
        allowNull: true, // Bisa null jika belum verifikasi
      },
      registration_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      called_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completion_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      missed_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      recalled_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      called_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Bisa null jika tidak dipanggil oleh admin spesifik
        // References model User
      },
      completed_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Bisa null
        // References model User
      },
    },
    {
      tableName: "queues", // Pastikan ini sesuai dengan nama tabel Anda di DB
      timestamps: false, // Karena kita mengelola created_at, updated_at secara manual (registration_time)
      underscored: true, // Jika nama kolom di DB menggunakan underscore
      indexes: [
        {
          // Unique composite index (gabungan service_id, queue_date, queue_number_daily)
          unique: true,
          fields: ["service_id", "queue_date", "queue_number_daily"],
          name: "unique_queue_per_day_service",
        },
      ],
    }
  );

  // Definisikan Asosiasi (Relasi)
  Queue.associate = function (models) {
    // Queue belongs to a Service
    Queue.belongsTo(models.Service, {
      foreignKey: "service_id",
      as: "service", // Nama alias untuk akses di query (e.g., Queue.include('service'))
    });

    // Queue optionally belongs to a User who called it
    Queue.belongsTo(models.User, {
      foreignKey: "called_by_user_id",
      as: "caller",
      allowNull: true, // Memungkinkan kolom ini null
    });

    // Queue optionally belongs to a User who completed it
    Queue.belongsTo(models.User, {
      foreignKey: "completed_by_user_id",
      as: "completer",
      allowNull: true, // Memungkinkan kolom ini null
    });
  };

  return Queue;
};
