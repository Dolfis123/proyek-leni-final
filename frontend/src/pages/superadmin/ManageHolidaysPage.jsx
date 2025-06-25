import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Modal from '../../components/ui/Modal';
import HolidayForm from '../../components/forms/HolidayForm';
import { getAllHolidays, createHoliday, updateHoliday, deleteHoliday } from '../../api/system';
import toast from 'react-hot-toast';

const ManageHolidaysPage = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editHolidayData, setEditHolidayData] = useState(null);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // --- State Paginasi BARU ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7); // Menampilkan 7 data per halaman
    // --- Akhir State Paginasi BARU ---

    const effectRan = useRef(false);

    // Fungsi untuk mengambil data hari libur
    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const data = await getAllHolidays();
            setHolidays(data);
            return true;
        } catch (err) {
            console.error('Gagal mengambil hari libur:', err);
            const msg = err.response?.data?.message || 'Gagal memuat daftar hari libur.';
            toast.error(msg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // useEffect untuk memicu pengambilan data saat komponen dimuat
    useEffect(() => {
        const loadHolidays = async () => {
            const success = await fetchHolidays();
            if (success) {
                toast.success('Daftar hari libur berhasil dimuat!');
            }
        };

        if (effectRan.current === false) {
            loadHolidays();
            effectRan.current = true;
        }
    }, []);

    // --- Logika Paginasi BARU ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentHolidays = holidays.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(holidays.length / itemsPerPage);

    const handleNextPage = () => {
        setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
    };

    const handlePrevPage = () => {
        setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
    };
    // --- Akhir Logika Paginasi BARU ---

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
                toast.success('Hari libur berhasil diperbarui!');
            } else {
                await createHoliday(formData);
                toast.success('Hari libur baru berhasil ditambahkan!');
            }
            await fetchHolidays(); // Refresh daftar hari libur
            handleCloseModal();
        } catch (err) {
            console.error('Gagal menyimpan hari libur:', err);
            setFormError(err.response?.data?.message || 'Gagal menyimpan hari libur.');
            toast.error(err.response?.data?.message || 'Gagal menyimpan hari libur.');
        } finally {
            setFormLoading(false);
        }
    };

    // Hapus Hari Libur
    const handleDeleteHoliday = async (holidayId) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus hari libur ini? Tindakan ini tidak dapat dibatalkan.')) {
            try {
                await deleteHoliday(holidayId);
                toast.success('Hari libur berhasil dihapus!');
                await fetchHolidays(); // Refresh daftar hari libur
            } catch (err) {
                console.error('Gagal menghapus hari libur:', err);
                toast.error(err.response?.data?.message || 'Gagal menghapus hari libur.');
            }
        }
    };

    return (
        <DashboardLayout title="Manage Holidays">
            <div className="bg-white p-8 rounded-2xl shadow-2xl transition-all duration-300 ease-in-out">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Daftar Hari Libur</h2>
                    <button
                        onClick={handleAddHoliday}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-xl transition duration-300 transform hover:scale-105"
                    >
                        + Tambah Hari Libur Baru
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
                        <p className="ml-4 text-blue-500 text-lg">Memuat hari libur...</p>
                    </div>
                ) : (
                    <>
                        {/* Tabel Hari Libur */}
                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">No</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nama Hari Libur</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Berulang</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentHolidays.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-lg font-medium">Tidak ada hari libur ditemukan di halaman ini.</td>
                                        </tr>
                                    ) : (
                                        currentHolidays.map((holiday, index) => (
                                            <tr key={holiday.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{indexOfFirstItem + index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {new Date(holiday.holiday_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{holiday.holiday_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${holiday.is_recurring ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {holiday.is_recurring ? 'Ya' : 'Tidak'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <button
                                                        onClick={() => handleEditHoliday(holiday)}
                                                        className="text-blue-600 hover:text-blue-900 mr-4 transition-colors duration-200"
                                                        title="Edit Hari Libur"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteHoliday(holiday.id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                                        title="Hapus Hari Libur"
                                                    >
                                                        Hapus
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Kontrol Paginasi */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-6 space-x-4">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1 || loading}
                                    className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    &larr; Sebelumnya
                                </button>
                                <span className="text-gray-700 font-medium">Halaman {currentPage} dari {totalPages}</span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages || loading}
                                    className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    Berikutnya &rarr;
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add/Edit Holiday Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editHolidayData ? `Edit Hari Libur: ${editHolidayData.holiday_name}` : 'Tambah Hari Libur Baru'}
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