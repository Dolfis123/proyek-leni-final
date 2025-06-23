// controllers/serviceController.js
const db = require('../models'); // Mengimpor semua model Sequelize
const Service = db.Service; // Mengambil model Service

// Publik: Mendapatkan daftar layanan aktif
const getActiveServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            where: { is_active: true },
            attributes: ['id', 'service_name', 'service_prefix', 'estimated_duration_minutes', 'description']
        });
        res.status(200).json(services);
    } catch (error) {
        console.error('Error getting active services (Sequelize):', error);
        res.status(500).json({ message: 'Error retrieving active services.' });
    }
};

// Admin/Super Admin: Mendapatkan semua layanan (termasuk non-aktif)
const getAllServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            attributes: ['id', 'service_name', 'service_prefix', 'estimated_duration_minutes', 'description', 'is_active', 'created_at', 'updated_at']
        });
        res.status(200).json(services);
    } catch (error) {
        console.error('Error getting all services (Sequelize):', error);
        res.status(500).json({ message: 'Error retrieving all services.' });
    }
};

// Admin/Super Admin: Membuat layanan baru
const createService = async (req, res) => {
    const { service_name, service_prefix, estimated_duration_minutes, description } = req.body;

    if (!service_name || !service_prefix) {
        return res.status(400).json({ message: 'Service name and prefix are required.' });
    }
    if (estimated_duration_minutes && (estimated_duration_minutes <= 0 || !Number.isInteger(estimated_duration_minutes))) {
        return res.status(400).json({ message: 'Estimated duration must be a positive integer.' });
    }

    try {
        const newService = await Service.create({
            service_name,
            service_prefix,
            estimated_duration_minutes,
            description
        });
        res.status(201).json({ message: 'Service created successfully!', service: newService });
    } catch (error) {
        console.error('Error creating service (Sequelize):', error);
        if (error.name === 'SequelizeUniqueConstraintError') { // Tangani error duplikasi
            return res.status(409).json({ message: 'Service with this name or prefix already exists.' });
        }
        res.status(500).json({ message: 'Error creating service.' });
    }
};

// Admin/Super Admin: Memperbarui layanan
const updateService = async (req, res) => {
    const { id } = req.params;
    const { service_name, service_prefix, estimated_duration_minutes, description, is_active } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Service ID is required.' });
    }
    if (estimated_duration_minutes !== undefined && (estimated_duration_minutes <= 0 || !Number.isInteger(estimated_duration_minutes))) {
        return res.status(400).json({ message: 'Estimated duration must be a positive integer.' });
    }

    try {
        const service = await Service.findByPk(id); // Cari layanan berdasarkan Primary Key
        if (!service) {
            return res.status(404).json({ message: 'Service not found.' });
        }

        const updateData = {};
        if (service_name) updateData.service_name = service_name;
        if (service_prefix) updateData.service_prefix = service_prefix;
        if (estimated_duration_minutes !== undefined) updateData.estimated_duration_minutes = estimated_duration_minutes;
        if (description !== undefined) updateData.description = description;
        if (is_active !== undefined) updateData.is_active = is_active;

        await service.update(updateData); // Lakukan update

        res.status(200).json({ message: 'Service updated successfully.' });
    } catch (error) {
        console.error('Error updating service (Sequelize):', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(409).json({ message: 'Another service with this name or prefix already exists.' });
        }
        res.status(500).json({ message: 'Error updating service.' });
    }
};

// Admin/Super Admin: Menghapus layanan
const deleteService = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Service ID is required.' });
    }

    try {
        const service = await Service.findByPk(id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found.' });
        }

        await service.destroy(); // Hapus layanan

        res.status(200).json({ message: 'Service deleted successfully.' });
    } catch (error) {
        console.error('Error deleting service (Sequelize):', error);
        if (error.name === 'SequelizeForeignKeyConstraintError') { // Tangani Foreign Key
             return res.status(409).json({ message: 'Cannot delete service as it is linked to existing queue entries.' });
        }
        res.status(500).json({ message: 'Error deleting service.' });
    }
};

module.exports = {
    getActiveServices,
    getAllServices,
    createService,
    updateService,
    deleteService
};