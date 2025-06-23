// src/pages/superadmin/ManageHolidaysPage.jsx
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Modal from '../../components/ui/Modal';
import HolidayForm from '../../components/forms/HolidayForm'; // Import komponen HolidayForm
import { getAllHolidays, createHoliday, updateHoliday, deleteHoliday } from '../../api/system'; // Import fungsi API holiday

const ManageHolidaysPage = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editHolidayData, setEditHolidayData] = useState(null);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Fungsi untuk mengambil data hari libur
    const fetchHolidays = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getAllHolidays();
            setHolidays(data);
        } catch (err) {
            console.error('Failed to fetch holidays:', err);
            setError(err.message || 'Failed to load holidays.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    // Buka modal untuk tambah hari libur
    const handleAddHoliday = () => {
        setEditHolidayData(null);
        setFormError('');
        setIsModalOpen(true);
    };

    // Buka modal untuk edit hari libur
    const handleEditHoliday = (holiday) => {
        setEditHolidayData(holiday);
        setFormError('');
        setIsModalOpen(true);
    };

    // Tutup modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditHolidayData(null);
        setFormError('');
    };

    // Submit form (Add atau Edit)
    const handleSubmitHoliday = async (formData) => {
        setFormLoading(true);
        setFormError('');
        try {
            if (editHolidayData) {
                await updateHoliday(editHolidayData.id, formData);
                console.log('Holiday updated successfully');
            } else {
                await createHoliday(formData);
                console.log('Holiday added successfully');
            }
            await fetchHolidays(); // Refresh daftar hari libur
            handleCloseModal(); // Tutup modal
        } catch (err) {
            console.error('Failed to save holiday:', err);
            setFormError(err.message || 'Failed to save holiday.');
        } finally {
            setFormLoading(false);
        }
    };

    // Hapus Hari Libur
    const handleDeleteHoliday = async (holidayId) => {
        if (window.confirm('Are you sure you want to delete this holiday? This action cannot be undone.')) {
            try {
                await deleteHoliday(holidayId);
                console.log('Holiday deleted successfully');
                await fetchHolidays(); // Refresh daftar hari libur
            } catch (err) {
                console.error('Failed to delete holiday:', err);
                setError(err.message || 'Failed to delete holiday.');
            }
        }
    };

    return (
        <DashboardLayout title="Manage Holidays">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Holidays List</h2>
                    <button
                        onClick={handleAddHoliday}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
                    >
                        + Add New Holiday
                    </button>
                </div>

                {loading && <p className="text-blue-500 text-center">Loading holidays...</p>}
                {error && <p className="text-red-500 text-center">{error}</p>}

                {!loading && !error && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holiday Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurring</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {holidays.map((holiday) => (
                                    <tr key={holiday.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {new Date(holiday.holiday_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{holiday.holiday_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${holiday.is_recurring ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {holiday.is_recurring ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEditHoliday(holiday)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteHoliday(holiday.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {holidays.length === 0 && !loading && (
                            <p className="text-center text-gray-500 py-4">No holidays found.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Add/Edit Holiday Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editHolidayData ? `Edit Holiday: ${editHolidayData.holiday_name}` : 'Add New Holiday'}
            >
                <HolidayForm
                    onSubmit={handleSubmitHoliday}
                    initialData={editHolidayData}
                    isEditMode={!!editHolidayData}
                    loading={formLoading}
                    error={formError}
                />
            </Modal>
        </DashboardLayout>
    );
};

export default ManageHolidaysPage;