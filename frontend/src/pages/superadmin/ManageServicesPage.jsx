// src/pages/superadmin/ManageServicesPage.jsx
import React, { useEffect, useState, useRef } from 'react'; // <<< TAMBAHKAN useRef
import DashboardLayout from '../../components/common/DashboardLayout';
import Modal from '../../components/ui/Modal';
import ServiceForm from '../../components/forms/ServiceForm'; // Import komponen ServiceForm
import { getAllServices, createService, updateService, deleteService } from '../../api/services'; // Import fungsi API service
import toast from 'react-hot-toast'; // <<< PASTIKAN INI DIIMPORT

const ManageServicesPage = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(''); // <<< DIHAPUS, diganti toast.error
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editServiceData, setEditServiceData] = useState(null); 
    const [formError, setFormError] = useState(''); // TETAP ADA, untuk error di dalam modal form
    const [formLoading, setFormLoading] = useState(false); 

    const effectRan = useRef(false); // <<< BARU: useRef untuk melacak eksekusi useEffect

    // --- Fungsi: Mengambil Data Layanan dari Backend ---
    const fetchServices = async () => {
        setLoading(true);
        // setError(''); // <<< DIHAPUS
        try {
            const data = await getAllServices(); // Menggunakan fungsi dari service API
            setServices(data);
            return true; // Mengembalikan true jika fetch berhasil
        } catch (err) {
            console.error('Gagal mengambil layanan:', err);
            // setError(err.response?.data?.message || 'Gagal memuat layanan.'); // <<< DIHAPUS
            const msg = err.response?.data?.message || 'Gagal memuat daftar layanan.';
            toast.error(msg); // <<< BARU: Toast error
            return false; // Mengembalikan false jika fetch gagal
        } finally {
            setLoading(false);
        }
    };

    // --- useEffect: Memicu Pengambilan Data Layanan Saat Komponen Dimuat ---
    useEffect(() => {
        // DEBUGGING: Log setiap kali useEffect dieksekusi
        console.log('[ManageServicesPage] useEffect (loadServices) triggered');

        const loadServices = async () => {
            const success = await fetchServices(); // Panggil fetchServices
            if (success) {
                console.log('[ManageServicesPage] loadServices successful, attempting to show toast'); // DEBUGGING
                toast.success('Daftar layanan berhasil dimuat!'); // <<< BARU: Panggil toast di sini hanya jika sukses
            }
        };

        // Menggunakan effectRan.current untuk memastikan loadServices hanya dijalankan sekali per mount
        if (effectRan.current === false) { 
            loadServices();
            effectRan.current = true; 
        }
        
        // Cleanup function (tidak relevan untuk kasus ini, tapi praktik baik)
        return () => {
            console.log('[ManageServicesPage] useEffect cleanup triggered'); // DEBUGGING
        };
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
                await updateService(editServiceData.id, formData); 
                toast.success('Layanan berhasil diperbarui!'); // <<< BARU: Toast sukses
            } else {
                // Mode Add
                await createService(formData); 
                toast.success('Layanan baru berhasil ditambahkan!'); // <<< BARU: Toast sukses
            }
            await fetchServices(); // Refresh daftar layanan setelah operasi
            handleCloseModal(); // Tutup modal setelah sukses
        } catch (err) {
            console.error('Gagal menyimpan layanan:', err);
            setFormError(err.response?.data?.message || 'Gagal menyimpan layanan.'); // TETAP ADA, untuk error di dalam modal
            toast.error(err.response?.data?.message || 'Gagal menyimpan layanan.'); // <<< BARU: Toast error
        } finally {
            setFormLoading(false);
        }
    };

    // Hapus Layanan
    const handleDeleteService = async (serviceId) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus layanan ini? Tindakan ini tidak dapat dibatalkan.')) {
            try {
                await deleteService(serviceId); // Menggunakan fungsi deleteService
                toast.success('Layanan berhasil dihapus!'); // <<< BARU: Toast sukses
                await fetchServices(); // Refresh daftar layanan setelah hapus
            } catch (err) {
                console.error('Gagal menghapus layanan:', err);
                // setError(err.response?.data?.message || 'Gagal menghapus layanan.'); // <<< DIHAPUS
                toast.error(err.response?.data?.message || 'Gagal menghapus layanan.'); // <<< BARU: Toast error
            }
        }
    };

    // DEBUGGING: Log setiap kali komponen dirender
    console.log('[ManageServicesPage] Component Render');

    return (
        <DashboardLayout title="Manage Services">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Daftar Layanan</h2>
                    <button
                        onClick={handleAddService}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
                    >
                        + Tambah Layanan Baru
                    </button>
                </div>

                {loading && <p className="text-blue-500 text-center">Memuat layanan...</p>}
                {/* Error global dari fetchServices tidak lagi ditampilkan di sini, melainkan di toast */}
                {/* {error && <p className="text-red-500 text-center">{error}</p>} */} 

                {!loading && ( // Tampilkan tabel hanya jika tidak dalam kondisi loading
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Layanan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prefix</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimasi Durasi (menit)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {services.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Tidak ada layanan ditemukan.</td>
                                    </tr>
                                ) : (
                                    services.map((service) => (
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
                    error={formError} // Pesan error dari form modal tetap ditampilkan di dalam modal
                />
            </Modal>
        </DashboardLayout>
    );
};

export default ManageServicesPage;