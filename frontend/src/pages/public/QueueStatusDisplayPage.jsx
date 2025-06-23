// src/pages/public/QueueStatusDisplayPage.jsx
import React, { useEffect, useState, useRef } from 'react'; // <<< TAMBAHKAN useRef
import socket from '../../api/socket'; // Import Socket.IO client
import { getPublicQueueStatusAPI } from '../../api/queue'; // Untuk fetch awal jika socket lambat
import toast from 'react-hot-toast'; // <<< PASTIKAN INI DIIMPORT

const QueueStatusDisplayPage = () => {
    const [publicStatus, setPublicStatus] = useState([]); // Data antrian publik
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(''); // <<< DIHAPUS, diganti toast.error

    const effectRan = useRef(false); // <<< BARU: useRef untuk melacak eksekusi useEffect

    // --- Fungsi: Mengambil Data Awal Antrian Publik ---
    const fetchInitialData = async () => {
        setLoading(true);
        // setError(''); // Dihapus
        try {
            const data = await getPublicQueueStatusAPI(); // Panggil API untuk mendapatkan status publik
            setPublicStatus(data);
            console.log('Initial API data fetched:', data); // DEBUGGING
            return true; // Mengembalikan true jika fetch berhasil
        } catch (err) {
            console.error('Gagal mengambil status antrian publik awal:', err);
            const msg = err.message || 'Gagal memuat status antrian publik.';
            toast.error(msg); // <<< BARU: Toast error
            // setError(msg); // Jika ingin menampilkan error inline
            return false; // Mengembalikan false jika fetch gagal
        } finally {
            setLoading(false);
        }
    };

    // --- useEffect: Fetch Data Awal dan Mendengarkan Update Real-time ---
    useEffect(() => {
        // DEBUGGING: Log setiap kali useEffect ini dieksekusi
        console.log('[QueueStatusDisplayPage] useEffect triggered');

        // Pola untuk menjalankan fetchInitialData hanya sekali pada initial load
        if (effectRan.current === false) {
            const loadInitialData = async () => {
                const success = await fetchInitialData();
                if (success) {
                    console.log('[QueueStatusDisplayPage] Initial data loaded, attempting to show toast'); // DEBUGGING
                    toast.success('Status antrian publik berhasil dimuat!'); // <<< BARU: Toast sukses
                }
            };
            loadInitialData();
            effectRan.current = true; // Set flag setelah eksekusi pertama
        }

        // --- Mendengarkan Update Real-time dari Socket.IO ---
        socket.on('queue_update', (data) => {
            console.log('Menerima update antrian real-time dari socket:', data); // DEBUGGING
            // Asumsi 'data' dari backend sudah dalam format yang sama dengan API fetch
            setPublicStatus(data); 
            // Opsional: Tampilkan toast jika ada update signifikan
            // toast.info('Antrian diperbarui secara real-time!', {id: 'queue_update_toast'}); 
        });

        // --- Cleanup function: Hentikan mendengarkan event saat komponen di-unmount ---
        return () => {
            socket.off('queue_update'); 
            console.log('[QueueStatusDisplayPage] useEffect cleanup triggered'); // DEBUGGING
        };
    }, []); // Dependensi kosong, hanya berjalan sekali saat mount

    // --- Render Komponen ---
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-xl text-blue-600">Memuat status antrian real-time...</p>
            </div>
        );
    }

    // Tampilkan pesan error jika ada (error global)
    // Sekarang ditangani oleh react-hot-toast, jadi tidak perlu inline div ini
    // if (error) {
    //     return (
    //         <div className="min-h-screen flex items-center justify-center bg-gray-100">
    //             <p className="text-xl text-red-600">Error: {error}</p>
    //         </div>
    //     );
    // }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-8">
            <header className="text-center mb-10">
                <h1 className="text-5xl font-extrabold mb-2 tracking-wide">Pengadilan Negeri Manokwari</h1>
                <p className="text-2xl font-semibold text-purple-200">Sistem Antrian Real-time</p>
            </header>

            <main>
                {/* Pesan jika tidak ada antrian aktif */}
                {publicStatus.length === 0 && !loading ? ( // Hapus !error dari kondisi
                    <div className="text-center bg-white bg-opacity-20 p-8 rounded-lg shadow-xl">
                        <p className="text-3xl font-bold">Tidak ada antrian aktif saat ini.</p>
                        <p className="text-lg mt-2">Silakan daftar antrian baru.</p>
                    </div>
                ) : (
                    // Tampilan grid untuk status layanan
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {publicStatus.map(service => (
                            <div key={service.id} className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white border-opacity-30">
                                <h2 className="text-3xl font-bold text-yellow-300 mb-4 text-center">{service.service_name}</h2>
                                <div className="mb-4 text-center">
                                    <p className="text-xl font-medium">Nomor Sedang Dipanggil:</p>
                                    <p className="text-6xl font-extrabold text-white leading-tight">{service.calling_number || '---'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-medium">Antrian Menunggu:</p>
                                    <p className="text-4xl font-bold text-blue-300">{service.waiting_count}</p>
                                    <p className="text-sm text-gray-200 mt-1">Estimasi Waktu Tunggu: {service.estimated_wait_time}</p>
                                </div>
                                {/* Opsional: Tampilkan daftar antrian menunggu */}
                                {/* <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Daftar Menunggu:</h3>
                                    <ul className="list-disc list-inside text-sm">
                                        {service.queues && service.queues.filter(q => q.status === 'waiting').slice(0, 5).map(q => (
                                            <li key={q.id}>{q.full_queue_number} - {q.customer_name}</li>
                                        ))}
                                        {service.queues && service.queues.filter(q => q.status === 'waiting').length > 5 && <li>...</li>}
                                    </ul>
                                </div> */}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <footer className="text-center mt-12 text-gray-300 text-sm">
                &copy; {new Date().getFullYear()} Pengadilan Negeri Manokwari. Powered by Your App.
            </footer>
        </div>
    );
};

export default QueueStatusDisplayPage;