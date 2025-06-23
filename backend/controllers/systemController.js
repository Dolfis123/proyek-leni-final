// controllers/systemController.js
const db = require('../models'); // Mengimpor semua model Sequelize
const SystemSetting = db.SystemSetting; // Mengambil model SystemSetting
const Holiday = db.Holiday;           // Mengambil model Holiday

// --- System Settings ---

// Super Admin: Mendapatkan semua pengaturan sistem
const getAllSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.findAll({
            attributes: ['id', 'setting_key', 'setting_value', 'description', 'created_at', 'updated_at']
        });
        res.status(200).json(settings);
    } catch (error) {
        console.error('Error getting all settings (Sequelize):', error);
        res.status(500).json({ message: 'Error retrieving system settings.' });
    }
};

// Super Admin: Memperbarui atau membuat pengaturan sistem (UPSERT)
const setSetting = async (req, res) => {
    const { key, value, description } = req.body;

    if (!key || !value) {
        return res.status(400).json({ message: 'Setting key and value are required.' });
    }

    try {
        // Find existing or create new
        const [setting, created] = await SystemSetting.findOrCreate({
            where: { setting_key: key },
            defaults: { setting_value: value, description: description }
        });

        if (!created) { // If setting already existed, update it
            await setting.update({ setting_value: value, description: description });
        }
        
        res.status(200).json({ message: 'Setting updated/created successfully.', setting: setting });
    } catch (error) {
        console.error('Error setting system setting (Sequelize):', error);
        res.status(500).json({ message: 'Error setting system setting.' });
    }
};

// Super Admin: Menghapus pengaturan sistem
const deleteSetting = async (req, res) => {
    const { key } = req.params;

    if (!key) {
        return res.status(400).json({ message: 'Setting key is required.' });
    }

    try {
        const deletedRows = await SystemSetting.destroy({
            where: { setting_key: key }
        });
        if (deletedRows > 0) {
            res.status(200).json({ message: 'Setting deleted successfully.' });
        } else {
            res.status(404).json({ message: 'Setting not found.' });
        }
    } catch (error) {
        console.error('Error deleting system setting (Sequelize):', error);
        res.status(500).json({ message: 'Error deleting system setting.' });
    }
};

// --- Holidays ---

// Super Admin: Mendapatkan semua hari libur
const getAllHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.findAll({
            attributes: ['id', 'holiday_date', 'holiday_name', 'is_recurring', 'created_at', 'updated_at'],
            order: [['holiday_date', 'ASC']]
        });
        res.status(200).json(holidays);
    } catch (error) {
        console.error('Error getting all holidays (Sequelize):', error);
        res.status(500).json({ message: 'Error retrieving holidays.' });
    }
};

// Super Admin: Membuat hari libur baru
const createHoliday = async (req, res) => {
    const { holiday_date, holiday_name, is_recurring } = req.body;

    if (!holiday_date || !holiday_name) {
        return res.status(400).json({ message: 'Holiday date and name are required.' });
    }
    // Basic date validation (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(holiday_date)) {
        return res.status(400).json({ message: 'Holiday date must be in YYYY-MM-DD format.' });
    }

    try {
        const newHoliday = await Holiday.create({
            holiday_date,
            holiday_name,
            is_recurring: is_recurring || false // Ensure boolean
        });
        res.status(201).json({ message: 'Holiday created successfully!', holiday: newHoliday });
    } catch (error) {
        console.error('Error creating holiday (Sequelize):', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Holiday on this date already exists.' });
        }
        res.status(500).json({ message: 'Error creating holiday.' });
    }
};

// Super Admin: Memperbarui hari libur
const updateHoliday = async (req, res) => {
    const { id } = req.params;
    const { holiday_date, holiday_name, is_recurring } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Holiday ID is required.' });
    }
    if (holiday_date && !/^\d{4}-\d{2}-\d{2}$/.test(holiday_date)) {
        return res.status(400).json({ message: 'Holiday date must be in YYYY-MM-DD format.' });
    }

    try {
        const holiday = await Holiday.findByPk(id);
        if (!holiday) {
            return res.status(404).json({ message: 'Holiday not found.' });
        }

        const updateData = {};
        if (holiday_date) updateData.holiday_date = holiday_date;
        if (holiday_name) updateData.holiday_name = holiday_name;
        if (is_recurring !== undefined) updateData.is_recurring = is_recurring;

        await holiday.update(updateData);

        res.status(200).json({ message: 'Holiday updated successfully.' });
    } catch (error) {
        console.error('Error updating holiday (Sequelize):', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Another holiday on this date already exists.' });
        }
        res.status(500).json({ message: 'Error updating holiday.' });
    }
};

// Super Admin: Menghapus hari libur
const deleteHoliday = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Holiday ID is required.' });
    }

    try {
        const deletedRows = await Holiday.destroy({
            where: { id: id }
        });
        if (deletedRows > 0) {
            res.status(200).json({ message: 'Holiday deleted successfully.' });
        } else {
            res.status(404).json({ message: 'Holiday not found.' });
        }
    } catch (error) {
        console.error('Error deleting holiday (Sequelize):', error);
        res.status(500).json({ message: 'Error deleting holiday.' });
    }
};

module.exports = {
    getAllSettings,
    setSetting,
    deleteSetting,
    getAllHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday
};