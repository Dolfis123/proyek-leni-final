import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Modal from '../../components/ui/Modal';
import ServiceForm from '../../components/forms/ServiceForm';
import { getAllServices, createService, updateService, deleteService } from '../../api/services';
import toast from 'react-hot-toast';

const ManageServicesPage = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editServiceData, setEditServiceData] = useState(null);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // --- State Paginasi BARU ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7); // Menampilkan 7 data per halaman
    // --- Akhir State Paginasi BARU ---

    const effectRan = useRef(false);

    // --- Fungsi: Mengambil Data Layanan dari Backend ---
    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await getAllServices();
            setServices(data);
            return true;
        } catch (err) {
            console.error('Gagal mengambil layanan:', err);
            const msg = err.response?.data?.message || 'Gagal memuat daftar layanan.';
            toast.error(msg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // --- useEffect: Memicu Pengambilan Data Layanan Saat Komponen Dimuat ---
    useEffect(() => {
        const loadServices = async () => {
            const success = await fetchServices();
            if (success) {
                toast.success('Daftar layanan berhasil dimuat!');
            }
        };

        if (effectRan.current === false) {
            loadServices();
            effectRan.current = true;
        }
    }, []);

    // --- Logika Paginasi BARU ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentServices = services.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(services.length / itemsPerPage);

    const handleNextPage = () => {
        setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
    };

    const handlePrevPage = () => {
        setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
    };
    // --- Akhir Logika Paginasi BARU ---

    const handleAddService = () => {
        setEditServiceData(null);
        setFormError('');
        setIsModalOpen(true);
    };

    const handleEditService = (service) => {
        setEditServiceData(service);
        setFormError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditServiceData(null);
        setFormError('');
    };

    const handleSubmitService = async (formData) => {
        setFormLoading(true);
        setFormError('');
        try {
            if (editServiceData) {
                await updateService(editServiceData.id, formData);
                toast.success('Layanan berhasil diperbarui!');
            } else {
                await createService(formData);
                toast.success('Layanan baru berhasil ditambahkan!');
            }
            await fetchServices();
            handleCloseModal();
        } catch (err) {
            console.error('Gagal menyimpan layanan:', err);
            setFormError(err.response?.data?.message || 'Gagal menyimpan layanan.');
            toast.error(err.response?.data?.message || 'Gagal menyimpan layanan.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus layanan ini? Tindakan ini tidak dapat dibatalkan.')) {
            try {
                await deleteService(serviceId);
                toast.success('Layanan berhasil dihapus!');
                await fetchServices();
            } catch (err) {
                console.error('Gagal menghapus layanan:', err);
                toast.error(err.response?.data?.message || 'Gagal menghapus layanan.');
            }
        }
    };

    return (
        <DashboardLayout title="Manage Services">
            <div className="bg-white p-8 rounded-2xl shadow-2xl transition-all duration-300 ease-in-out">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Daftar Layanan</h2>
                    <button
                        onClick={handleAddService}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-xl transition duration-300 transform hover:scale-105"
                    >
                        + Tambah Layanan Baru
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
                        <p className="ml-4 text-blue-500 text-lg">Memuat layanan...</p>
                    </div>
                ) : (
                    <>
                        {/* Tabel Layanan */}
                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">No</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nama Layanan</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Prefix</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Durasi (menit)</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Deskripsi</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentServices.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-gray-500 text-lg font-medium">Tidak ada layanan ditemukan di halaman ini.</td>
                                        </tr>
                                    ) : (
                                        currentServices.map((service, index) => (
                                            <tr key={service.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{indexOfFirstItem + index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.service_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{service.service_prefix}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{service.estimated_duration_minutes}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{service.description || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {service.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <button
                                                        onClick={() => handleEditService(service)}
                                                        className="text-blue-600 hover:text-blue-900 mr-4 transition-colors duration-200"
                                                        title="Edit Layanan"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteService(service.id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                                        title="Hapus Layanan"
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

            {/* Komponen Modal untuk Tambah/Edit Layanan */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editServiceData ? `Edit Layanan: ${editServiceData.service_name}` : 'Tambah Layanan Baru'}
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