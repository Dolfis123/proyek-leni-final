// src/pages/superadmin/ManageHolidaysPage.jsx
import React, { useEffect, useState, useRef } from 'react'; // <<< TAMBAHKAN useRef
import DashboardLayout from '../../components/common/DashboardLayout';
import Modal from '../../components/ui/Modal';
import HolidayForm from '../../components/forms/HolidayForm'; // Import komponen HolidayForm
import { getAllHolidays, createHoliday, updateHoliday, deleteHoliday } from '../../api/system'; // Import fungsi API holiday
import toast from 'react-hot-toast'; // <<< PASTIKAN INI DIIMPORT

const ManageHolidaysPage = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(''); // <<< DIHAPUS, diganti toast.error
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editHolidayData, setEditHolidayData] = useState(null);
    const [formError, setFormError] = useState(''); // TETAP ADA, untuk error di dalam modal form
    const [formLoading, setFormLoading] = useState(false);

    const effectRan = useRef(false); // <<< BARU: useRef untuk melacak eksekusi useEffect

    // Fungsi untuk mengambil data hari libur
    const fetchHolidays = async () => {
        setLoading(true);
        // setError(''); // <<< DIHAPUS
        try {
            const data = await getAllHolidays();
            setHolidays(data);
            return true; // Mengembalikan true jika fetch berhasil
        } catch (err) {
            console.error('Gagal mengambil hari libur:', err);
            // setError(err.message || 'Gagal memuat hari libur.'); // <<< DIHAPUS
            const msg = err.response?.data?.message || 'Gagal memuat daftar hari libur.';
            toast.error(msg); // <<< BARU: Toast error
            return false; // Mengembalikan false jika fetch gagal
        } finally {
            setLoading(false);
        }
    };

    // useEffect untuk memicu pengambilan data saat komponen dimuat
    useEffect(() => {
        // DEBUGGING: Log setiap kali useEffect dieksekusi
        console.log('[ManageHolidaysPage] useEffect (loadHolidays) triggered');

        const loadHolidays = async () => {
            const success = await fetchHolidays(); // Panggil fetchHolidays
            if (success) {
                console.log('[ManageHolidaysPage] loadHolidays successful, attempting to show toast'); // DEBUGGING
                toast.success('Daftar hari libur berhasil dimuat!'); // <<< BARU: Panggil toast di sini hanya jika sukses
            }
        };

        // Menggunakan effectRan.current untuk memastikan loadHolidays hanya dijalankan sekali per mount
        if (effectRan.current === false) { 
            loadHolidays();
            effectRan.current = true; 
        }
        
        // Cleanup function
        return () => {
            console.log('[ManageHolidaysPage] useEffect cleanup triggered'); // DEBUGGING
        };
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
                toast.success('Hari libur berhasil diperbarui!'); // <<< BARU: Toast sukses
            } else {
                await createHoliday(formData);
                toast.success('Hari libur baru berhasil ditambahkan!'); // <<< BARU: Toast sukses
            }
            await fetchHolidays(); // Refresh daftar hari libur
            handleCloseModal(); // Tutup modal
        } catch (err) {
            console.error('Gagal menyimpan hari libur:', err);
            setFormError(err.response?.data?.message || 'Gagal menyimpan hari libur.'); // TETAP ADA, untuk error di dalam modal
            toast.error(err.response?.data?.message || 'Gagal menyimpan hari libur.'); // <<< BARU: Toast error
        } finally {
            setFormLoading(false);
        }
    };

    // Hapus Hari Libur
    const handleDeleteHoliday = async (holidayId) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus hari libur ini? Tindakan ini tidak dapat dibatalkan.')) {
            try {
                await deleteHoliday(holidayId);
                toast.success('Hari libur berhasil dihapus!'); // <<< BARU: Toast sukses
                await fetchHolidays(); // Refresh daftar hari libur
            } catch (err) {
                console.error('Gagal menghapus hari libur:', err);
                // setError(err.message || 'Gagal menghapus hari libur.'); // <<< DIHAPUS
                toast.error(err.response?.data?.message || 'Gagal menghapus hari libur.'); // <<< BARU: Toast error
            }
        }
    };

    // DEBUGGING: Log setiap kali komponen dirender
    console.log('[ManageHolidaysPage] Component Render');

    return (
        <DashboardLayout title="Manage Holidays">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Daftar Hari Libur</h2>
                    <button
                        onClick={handleAddHoliday}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
                    >
                        + Tambah Hari Libur Baru
                    </button>
                </div>

                {loading && <p className="text-blue-500 text-center">Memuat hari libur...</p>}
                {/* Error global dari fetchHolidays tidak lagi ditampilkan di sini, melainkan di toast */}
                {/* {error && <p className="text-red-500 text-center">{error}</p>} */}

                {!loading && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Hari Libur</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Berulang</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {holidays.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Tidak ada hari libur ditemukan.</td>
                                    </tr>
                                ) : (
                                    holidays.map((holiday) => (
                                        <tr key={holiday.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {new Date(holiday.holiday_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{holiday.holiday_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${holiday.is_recurring ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {holiday.is_recurring ? 'Ya' : 'Tidak'}
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
                                                    Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
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
                    error={formError} // Error dari form modal tetap ditampilkan di dalam modal
                />
            </Modal>
        </DashboardLayout>
    );
};

export default ManageHolidaysPage;