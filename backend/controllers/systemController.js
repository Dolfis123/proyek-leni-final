// controllers/systemController.js

// --- Impor Modul yang Diperlukan ---
const moment = require("moment-timezone"); // Library untuk manajemen waktu dan zona waktu
const db = require("../models"); // Mengimpor semua model Sequelize
const { Op } = require("sequelize"); // Mengimpor operator Sequelize

// --- Ambil Model dari Database ---
const SystemSetting = db.SystemSetting;
const Holiday = db.Holiday;

// =================================================================
// MIDDLEWARE
// =================================================================

/**
 * Middleware untuk memeriksa apakah layanan sedang dalam jam operasional.
 * Ini akan memblokir request jika di luar jam kerja, saat jam istirahat, atau pada hari libur.
 *
 * @param {Object} req - Objek request Express.
 * @param {Object} res - Objek response Express.
 * @param {Function} next - Fungsi callback untuk melanjutkan ke middleware/controller berikutnya.
 */
const checkOperationalStatus = async (req, res, next) => {
  console.log(
    "--- Middleware checkOperationalStatus dijalankan dengan kode baru pada:",
    new Date().toString()
  );

  try {
    // 1. Gunakan moment-timezone untuk mendapatkan waktu saat ini di zona waktu WIT (Asia/Jayapura)
    const currentMoment = moment().tz("Asia/Jayapura");
    const currentHour = currentMoment.hour();
    const currentMinute = currentMoment.minute();

    // 2. Cek apakah hari ini adalah hari libur nasional/cuti bersama
    const todayDate = currentMoment.format("YYYY-MM-DD");
    const holiday = await Holiday.findOne({
      where: { holiday_date: todayDate },
    });

    if (holiday) {
      // Jika hari ini libur, langsung tolak request
      return res
        .status(403)
        .json({ message: `Layanan tutup hari ini: ${holiday.holiday_name}` });
    }

    // 3. Ambil pengaturan jam operasional dari database
    const settingKeys = [
      "monday_open_time",
      "monday_close_time",
      "monday_break_start_time",
      "monday_break_end_time",
    ];
    const settings = await SystemSetting.findAll({
      where: {
        setting_key: {
          [Op.in]: settingKeys,
        },
      },
    });

    // Fungsi helper untuk mendapatkan nilai dari settings dengan aman
    const getSettingValue = (key, defaultValue) => {
      const setting = settings.find((s) => s.setting_key === key);
      return setting ? setting.setting_value : defaultValue;
    };

    // Ambil nilai jam atau gunakan default jika tidak ada di database
    const openTimeStr = getSettingValue("monday_open_time", "07:00");
    const closeTimeStr = getSettingValue("monday_close_time", "23:00");
    const breakStartTimeStr = getSettingValue(
      "monday_break_start_time",
      "12:00"
    );
    const breakEndTimeStr = getSettingValue("monday_break_end_time", "13:00");

    // 4. Konversi semua waktu ke format menit untuk perbandingan yang mudah
    const parseTimeToMinutes = (timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const openMinutes = parseTimeToMinutes(openTimeStr);
    const closeMinutes = parseTimeToMinutes(closeTimeStr);
    const breakStartMinutes = parseTimeToMinutes(breakStartTimeStr);
    const breakEndMinutes = parseTimeToMinutes(breakEndTimeStr);
    const currentMinutes = currentHour * 60 + currentMinute;

    // 5. Lakukan Pengecekan
    // Cek di luar jam operasional utama
    if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
      return res.status(403).json({
        message: `Layanan tutup. Jam operasional: ${openTimeStr} - ${closeTimeStr} WIT.`,
      });
    }

    // Cek di dalam jam istirahat
    if (
      currentMinutes >= breakStartMinutes &&
      currentMinutes < breakEndMinutes
    ) {
      return res.status(403).json({
        message: `Layanan sedang istirahat. Akan dilanjutkan pukul ${breakEndTimeStr} WIT.`,
      });
    }

    // 6. Jika semua pengecekan lolos, izinkan request untuk melanjutkan
    next();
  } catch (error) {
    // Tangani error internal jika terjadi masalah saat query database, dll.
    console.error("Error in checkOperationalStatus middleware:", error);

    return res.status(500).json({
      message:
        "Terjadi kesalahan pada server saat memeriksa status operasional.",
    });
  }
};

// =================================================================
// CONTROLLERS (CRUD untuk Settings & Holidays)
// =================================================================

// --- System Settings ---

// Super Admin: Mendapatkan semua pengaturan sistem
const getAllSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll({
      attributes: [
        "id",
        "setting_key",
        "setting_value",
        "description",
        "created_at",
        "updated_at",
      ],
    });
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error getting all settings (Sequelize):", error);
    res.status(500).json({ message: "Error retrieving system settings." });
  }
};

// Super Admin: Memperbarui atau membuat pengaturan sistem (UPSERT)
const setSetting = async (req, res) => {
  const { key, value, description } = req.body;

  if (!key || !value) {
    return res
      .status(400)
      .json({ message: "Setting key and value are required." });
  }

  try {
    const [setting, created] = await SystemSetting.findOrCreate({
      where: { setting_key: key },
      defaults: { setting_value: value, description: description },
    });

    if (!created) {
      await setting.update({ setting_value: value, description: description });
    }

    res.status(200).json({
      message: "Setting updated/created successfully.",
      setting: setting,
    });
  } catch (error) {
    console.error("Error setting system setting (Sequelize):", error);
    res.status(500).json({ message: "Error setting system setting." });
  }
};

// Super Admin: Menghapus pengaturan sistem
const deleteSetting = async (req, res) => {
  const { key } = req.params;

  if (!key) {
    return res.status(400).json({ message: "Setting key is required." });
  }

  try {
    const deletedRows = await SystemSetting.destroy({
      where: { setting_key: key },
    });
    if (deletedRows > 0) {
      res.status(200).json({ message: "Setting deleted successfully." });
    } else {
      res.status(404).json({ message: "Setting not found." });
    }
  } catch (error) {
    console.error("Error deleting system setting (Sequelize):", error);
    res.status(500).json({ message: "Error deleting system setting." });
  }
};

// --- Holidays ---

// Super Admin: Mendapatkan semua hari libur
const getAllHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.findAll({
      attributes: [
        "id",
        "holiday_date",
        "holiday_name",
        "is_recurring",
        "created_at",
        "updated_at",
      ],
      order: [["holiday_date", "ASC"]],
    });
    res.status(200).json(holidays);
  } catch (error) {
    console.error("Error getting all holidays (Sequelize):", error);
    res.status(500).json({ message: "Error retrieving holidays." });
  }
};

// Super Admin: Membuat hari libur baru
const createHoliday = async (req, res) => {
  const { holiday_date, holiday_name, is_recurring } = req.body;

  if (!holiday_date || !holiday_name) {
    return res
      .status(400)
      .json({ message: "Holiday date and name are required." });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(holiday_date)) {
    return res
      .status(400)
      .json({ message: "Holiday date must be in YYYY-MM-DD format." });
  }

  try {
    const newHoliday = await Holiday.create({
      holiday_date,
      holiday_name,
      is_recurring: is_recurring || false,
    });
    res
      .status(201)
      .json({ message: "Holiday created successfully!", holiday: newHoliday });
  } catch (error) {
    console.error("Error creating holiday (Sequelize):", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "Holiday on this date already exists." });
    }
    res.status(500).json({ message: "Error creating holiday." });
  }
};

// Super Admin: Memperbarui hari libur
const updateHoliday = async (req, res) => {
  const { id } = req.params;
  const { holiday_date, holiday_name, is_recurring } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Holiday ID is required." });
  }
  if (holiday_date && !/^\d{4}-\d{2}-\d{2}$/.test(holiday_date)) {
    return res
      .status(400)
      .json({ message: "Holiday date must be in YYYY-MM-DD format." });
  }

  try {
    const holiday = await Holiday.findByPk(id);
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found." });
    }

    const updateData = {};
    if (holiday_date) updateData.holiday_date = holiday_date;
    if (holiday_name) updateData.holiday_name = holiday_name;
    if (is_recurring !== undefined) updateData.is_recurring = is_recurring;

    await holiday.update(updateData);

    res.status(200).json({ message: "Holiday updated successfully." });
  } catch (error) {
    console.error("Error updating holiday (Sequelize):", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "Another holiday on this date already exists." });
    }
    res.status(500).json({ message: "Error updating holiday." });
  }
};

// Super Admin: Menghapus hari libur
const deleteHoliday = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Holiday ID is required." });
  }

  try {
    const deletedRows = await Holiday.destroy({
      where: { id: id },
    });
    if (deletedRows > 0) {
      res.status(200).json({ message: "Holiday deleted successfully." });
    } else {
      res.status(404).json({ message: "Holiday not found." });
    }
  } catch (error) {
    console.error("Error deleting holiday (Sequelize):", error);
    res.status(500).json({ message: "Error deleting holiday." });
  }
};

// --- Ekspor semua fungsi agar bisa digunakan di file router ---
module.exports = {
  checkOperationalStatus, // <-- PENTING: Ekspor middleware baru
  getAllSettings,
  setSetting,
  deleteSetting,
  getAllHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
};
