// src/pages/superadmin/ManageServicesPage.jsx
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Modal from '../../components/ui/Modal';
import ServiceForm from '../../components/forms/ServiceForm'; // Import komponen ServiceForm
import { getAllServices, createService, updateService, deleteService } from '../../api/services'; // Import fungsi API service

const ManageServicesPage = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editServiceData, setEditServiceData] = useState(null); // Data layanan yang akan diedit
    const [formError, setFormError] = useState(''); // Error dari form modal
    const [formLoading, setFormLoading] = useState(false); // Loading state untuk form modal

    // Fungsi untuk mengambil data layanan
    const fetchServices = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getAllServices(); // Menggunakan fungsi dari service API
            setServices(data);
        } catch (err) {
            console.error('Failed to fetch services:', err);
            setError(err.message || 'Failed to load services.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // Buka modal untuk tambah layanan
    const handleAddService = () => {
        setEditServiceData(null);
        setFormError('');
        setIsModalOpen(true);
    };

    // Buka modal untuk edit layanan
    const handleEditService = (service) => {
        setEditServiceData(service);
        setFormError('');
        setIsModalOpen(true);
    };

    // Tutup modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditServiceData(null);
        setFormError('');
    };

    // Submit form (Add atau Edit)
    const handleSubmitService = async (formData) => {
        setFormLoading(true);
        setFormError('');
        try {
            if (editServiceData) {
                // Mode Edit
                await updateService(editServiceData.id, formData); // Menggunakan fungsi updateService
                console.log('Service updated successfully');
            } else {
                // Mode Add
                await createService(formData); // Menggunakan fungsi createService
                console.log('Service added successfully');
            }
            await fetchServices(); // Refresh daftar layanan
            handleCloseModal(); // Tutup modal
        } catch (err) {
            console.error('Failed to save service:', err);
            setFormError(err.message || 'Failed to save service.');
        } finally {
            setFormLoading(false);
        }
    };

    // Hapus Layanan
    const handleDeleteService = async (serviceId) => {
        if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
            try {
                await deleteService(serviceId); // Menggunakan fungsi deleteService
                console.log('Service deleted successfully');
                await fetchServices(); // Refresh daftar layanan
            } catch (err) {
                console.error('Failed to delete service:', err);
                setError(err.message || 'Failed to delete service.');
            }
        }
    };

    return (
        <DashboardLayout title="Manage Services">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Services List</h2>
                    <button
                        onClick={handleAddService}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
                    >
                        + Add New Service
                    </button>
                </div>

                {loading && <p className="text-blue-500 text-center">Loading services...</p>}
                {error && <p className="text-red-500 text-center">{error}</p>}

                {!loading && !error && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prefix</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Duration (min)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {services.map((service) => (
                                    <tr key={service.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.service_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{service.service_prefix}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{service.estimated_duration_minutes}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{service.description || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {service.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEditService(service)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteService(service.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {services.length === 0 && !loading && (
                            <p className="text-center text-gray-500 py-4">No services found.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Add/Edit Service Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editServiceData ? `Edit Service: ${editServiceData.service_name}` : 'Add New Service'}
            >
                <ServiceForm
                    onSubmit={handleSubmitService}
                    initialData={editServiceData}
                    isEditMode={!!editServiceData}
                    loading={formLoading}
                    error={formError}
                />
            </Modal>
        </DashboardLayout>
    );
};

export default ManageServicesPage;