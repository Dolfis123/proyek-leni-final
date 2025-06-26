// src/pages/admin/QueueManagementPage.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react'; // <<< PASTIKAN useRef DIIMPORT
import DashboardLayout from '../../components/common/DashboardLayout';
import { getAllServices } from '../../api/services'; // Untuk mendapatkan daftar layanan
import { getQueuesForAdmin, callNextQueue, markQueueStatus, recallLastCalledQueue } from '../../api/queue'; // API antrian admin
import socket from '../../api/socket'; // Socket.IO client
import { getCurrentUser } from '../../api/auth'; // Untuk mendapatkan info user (adminId)
import toast from 'react-hot-toast'; // <<< PASTIKAN INI DIIMPORT

const QueueManagementPage = () => {
    // eslint-disable-next-line no-unused-vars
    const currentUser = getCurrentUser(); // Admin yang sedang login
    const [services, setServices] = useState([]); // Daftar layanan yang tersedia
    const [selectedServiceId, setSelectedServiceId] = useState(''); // ID layanan/loket yang dipilih admin
    const [currentCallingQueue, setCurrentCallingQueue] = useState(null); // Antrian yang sedang dipanggil
    const [waitingQueues, setWaitingQueues] = useState([]); // Daftar antrian yang menunggu
    const [loading, setLoading] = useState(true); // Indikator loading data awal
    // const [error, setError] = useState(''); // <<< DIHAPUS, diganti toast.error
    const [actionLoading, setActionLoading] = useState(false); // Loading state untuk tombol aksi (panggil, selesai, dll.)

    const initialFetchRan = useRef(false); // <<< BARU: useRef untuk melacak eksekusi fetchServices pertama kali

    // --- Fetch daftar layanan saat komponen dimuat ---
    // Ini adalah fetch awal untuk mengisi dropdown layanan
    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            try {
                const data = await getAllServices();
                setServices(data);
                if (data.length > 0) {
                    // Set layanan pertama sebagai default jika belum ada yang dipilih
                    setSelectedServiceId(data[0].id);
                }
                toast.success('Daftar layanan berhasil dimuat!'); // <<< BARU: Toast sukses
            } catch (err) {
                console.error('Gagal mengambil layanan untuk admin:', err);
                const msg = err.response?.data?.message || 'Gagal memuat layanan untuk manajemen antrian.';
                toast.error(msg); // <<< BARU: Toast error
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []); // Dependensi kosong, hanya berjalan sekali saat mount

    // --- Fungsi: Mengambil Antrian untuk Layanan yang Dipilih ---
    // Menggunakan useCallback agar fungsi ini stabil dan tidak dibuat ulang setiap render
    const fetchQueues = useCallback(async (serviceId) => {
        if (!serviceId) {
            setCurrentCallingQueue(null);
            setWaitingQueues([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        // setError(''); // Dihapus
        try {
            const data = await getQueuesForAdmin(serviceId);
            setCurrentCallingQueue(data.currentCalling);
            setWaitingQueues(data.waitingQueues);
            console.log(`[Admin QM] Fetched queues for service ID ${serviceId}:`, data); // DEBUGGING
        } catch (err) {
            console.error('[Admin QM] Gagal mengambil antrian untuk admin:', err);
            const msg = err.message || 'Gagal memuat antrian untuk layanan ini.';
            toast.error(msg); // <<< BARU: Toast error
            // setError(msg); // Jika ingin menampilkan error inline
        } finally {
            setLoading(false);
        }
    }, []); // Dependensi kosong karena fungsi ini hanya bergantung pada serviceId yang diberikan

    // --- useEffect: Memicu Pengambilan Antrian Saat Layanan Dipilih ---
    useEffect(() => {
        // DEBUGGING: Log setiap kali useEffect ini dipicu
        console.log('[QueueManagementPage] useEffect (fetchQueues) triggered for selectedServiceId:', selectedServiceId);

        // Gunakan initialFetchRan untuk memastikan fetchQueues hanya dijalankan sekali secara otomatis
        // pada saat mount dan selectedServiceId pertama kali diset.
        // Setelah itu, setiap perubahan selectedServiceId akan memicu fetchQueues seperti biasa.
        if (initialFetchRan.current === false && selectedServiceId) {
            fetchQueues(selectedServiceId);
            initialFetchRan.current = true;
        } else if (selectedServiceId) { // Jika sudah bukan initial fetch, panggil fetchQueues saat serviceId berubah
            fetchQueues(selectedServiceId);
        }
    }, [selectedServiceId, fetchQueues]); 

    // --- useEffect: Mendengarkan Update Real-time dari Socket.IO ---
    useEffect(() => {
        // Event listener untuk update antrian dari backend
        socket.on('queue_update', (data) => {
            console.log('Menerima update antrian real-time untuk admin:', data);
            // Ketika ada update dari socket, panggil ulang fetchQueues untuk mendapatkan data terbaru
            // Ini adalah cara sederhana untuk refresh UI admin secara real-time
            if (selectedServiceId) { // Pastikan ada layanan yang dipilih sebelum refresh
                fetchQueues(selectedServiceId); 
                toast.info('Status antrian diperbarui secara real-time!'); // <<< BARU: Toast info
            }
        });

        // Cleanup function: Hentikan mendengarkan event saat komponen di-unmount
        return () => {
            socket.off('queue_update');
        };
    }, [selectedServiceId, fetchQueues]); // Re-subscribe jika layanan berubah

    // --- Handler: Memanggil Antrian Berikutnya ---
    const handleCallNextQueue = async () => {
        if (!selectedServiceId) {
            toast.warn('Mohon pilih layanan terlebih dahulu.'); // <<< BARU: Toast warn
            return;
        }
        setActionLoading(true); // Mulai loading tombol aksi
        // setError(''); // Dihapus
        try {
            await callNextQueue(selectedServiceId);
            toast.success('Antrian berikutnya berhasil dipanggil!'); // <<< BARU: Toast sukses
            await fetchQueues(selectedServiceId); // Refresh UI setelah aksi
        } catch (err) {
            console.error('Gagal memanggil antrian berikutnya:', err);
            const msg = err.message || 'Gagal memanggil antrian berikutnya.';
            toast.error(msg); // <<< BARU: Toast error
            // setError(msg); // Jika ingin menampilkan error inline
        } finally {
            setActionLoading(false); // Hentikan loading
        }
    };

    // --- Handler: Menandai Status Antrian (Selesai, Terlewat, Ditunda) ---
    const handleMarkQueueStatus = async (queueId, status) => {
        if (!currentCallingQueue) { // Pastikan ada antrian yang sedang dipanggil
             toast.warn('Tidak ada antrian yang sedang dipanggil untuk ditandai.');
             return;
        }
        if (!window.confirm(`Apakah Anda yakin ingin menandai antrian ini sebagai "${status}"?`)) {
            return;
        }
        setActionLoading(true);
        // setError(''); // Dihapus
        try {
            await markQueueStatus(queueId, status);
            toast.success(`Antrian berhasil ditandai sebagai ${status.replace('_', ' ')}.`); // <<< BARU: Toast sukses
            await fetchQueues(selectedServiceId); // Refresh UI setelah aksi
        } catch (err) {
            console.error(`Gagal menandai antrian sebagai ${status}:`, err);
            const msg = err.message || `Gagal menandai antrian sebagai ${status}.`;
            toast.error(msg); // <<< BARU: Toast error
            // setError(msg); // Jika ingin menampilkan error inline
        } finally {
            setActionLoading(false);
        }
    };

    // --- Handler: Memanggil Ulang Antrian Terakhir ---
    const handleRecallLastCalledQueue = async () => {
        if (!selectedServiceId) {
            toast.warn('Mohon pilih layanan terlebih dahulu.');
            return;
        }
        if (!currentCallingQueue) {
            toast.warn('Tidak ada antrian yang sedang dipanggil untuk dipanggil ulang.');
            return;
        }
        setActionLoading(true);
        // setError(''); // Dihapus
        try {
            await recallLastCalledQueue(selectedServiceId);
            toast.success('Antrian berhasil dipanggil ulang!'); // <<< BARU: Toast sukses
            await fetchQueues(selectedServiceId); // Refresh UI setelah aksi
        } catch (err) {
            console.error('Gagal memanggil ulang antrian terakhir:', err);
            const msg = err.message || 'Gagal memanggil ulang antrian terakhir.';
            toast.error(msg); // <<< BARU: Toast error
            // setError(msg); // Jika ingin menampilkan error inline
        } finally {
            setActionLoading(false);
        }
    };

    // --- Render Komponen ---
    return (
        <DashboardLayout title="Queue Management">
            {/* Bagian Pemilihan Layanan */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Pilih Layanan / Loket</h2>
                <div className="flex items-center space-x-4">
                    <label htmlFor="service-select" className="block text-sm font-medium text-gray-700">Pilih Layanan:</label>
                    <select
                        id="service-select"
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(Number(e.target.value))} // Konversi ke Number
                        className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                        {loading && <option value="">Memuat layanan...</option>}
                        {!loading && services.length === 0 && <option value="">Tidak ada layanan tersedia</option>}
                        {!loading && services.length > 0 && (
                            <>
                                <option value="">-- Pilih Layanan --</option>
                                {services.map(service => (
                                    <option key={service.id} value={service.id}>
                                        {service.service_name} ({service.service_prefix})
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                </div>
            </div>

            {/* Tampilan Manajemen Antrian Setelah Layanan Dipilih */}
            {selectedServiceId ? (
                <>
                    {loading && <p className="text-blue-500 text-center">Memuat antrian...</p>}
                    {/* Pesan error global dari fetchQueues tidak lagi ditampilkan di sini */}
                    {/* {error && <p className="text-red-500 text-center">{error}</p>} */}
                    {actionLoading && <p className="text-indigo-500 text-center">Memproses aksi...</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Antrian Sedang Dipanggil */}
                        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Sedang Dipanggil</h3>
                            <div className="text-center">
                                <p className="text-6xl font-extrabold text-blue-800 leading-tight">
                                    {currentCallingQueue ? currentCallingQueue.full_queue_number : '---'}
                                </p>
                                {currentCallingQueue && (
                                    <p className="text-xl text-gray-600 mt-2">{currentCallingQueue.customer_name}</p>
                                )}
                            </div>
                            <div className="flex justify-center mt-6 space-x-4">
                                <button
                                    onClick={() => handleMarkQueueStatus(currentCallingQueue.id, 'completed')}
                                    disabled={!currentCallingQueue || actionLoading}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Selesai
                                </button>
                                <button
                                    onClick={() => handleMarkQueueStatus(currentCallingQueue.id, 'missed')}
                                    disabled={!currentCallingQueue || actionLoading}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Terlewat
                                </button>
                                <button
                                    onClick={() => handleMarkQueueStatus(currentCallingQueue.id, 'on_hold')}
                                    disabled={!currentCallingQueue || actionLoading}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Tunda
                                </button>
                            </div>
                             <div className="flex justify-center mt-4">
                                <button
                                    onClick={handleRecallLastCalledQueue}
                                    disabled={!currentCallingQueue || actionLoading}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Panggil Ulang
                                </button>
                            </div>
                        </div>

                        {/* Tombol Aksi Utama */}
                        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Aksi Antrian</h3>
                            <button
                                onClick={handleCallNextQueue}
                                disabled={actionLoading || waitingQueues.length === 0} // Nonaktif jika tidak ada antrian menunggu
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 text-xl rounded-lg shadow-lg focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform duration-150 hover:scale-105"
                            >
                                {actionLoading ? 'Memanggil...' : 'Panggil Antrian Berikutnya'}
                            </button>
                            {waitingQueues.length === 0 && !loading && <p className="text-gray-500 mt-2">Tidak ada antrian menunggu.</p>}
                        </div>
                    </div>

                    {/* Daftar Antrian Menunggu */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Antrian Menunggu ({waitingQueues.length})</h3>
                        {waitingQueues.length === 0 ? (
                            <p className="text-gray-600 text-center">Tidak ada antrian yang menunggu saat ini.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Antrian</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telepon</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi Cepat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {waitingQueues.map((queue) => (
                                            <tr key={queue.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{queue.full_queue_number}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{queue.customer_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{queue.customer_email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{queue.customer_phone_number}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${queue.status === 'waiting' ? 'bg-blue-100 text-blue-800' :
                                                          queue.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' : ''}`
                                                    }>
                                                        {queue.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleMarkQueueStatus(queue.id, 'on_hold')}
                                                        className="text-yellow-600 hover:text-yellow-900 mr-2"
                                                        disabled={actionLoading}
                                                    >
                                                        Tunda
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : ( // Pesan jika belum ada layanan yang dipilih
                !loading && ( // Hapus !error dari kondisi
                    <p className="text-gray-600 text-center mt-8">Silakan pilih layanan untuk memulai manajemen antrian.</p>
                )
            )}
        </DashboardLayout>
    );
};

export default QueueManagementPage;