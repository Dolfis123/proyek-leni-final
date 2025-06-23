// src/pages/public/MyQueueStatusPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Untuk mendapatkan query params dari URL
import { getMyQueueStatus, requeueMissed } from '../../api/queue'; // Import API dari service
import { Link } from 'react-router-dom'; // Untuk navigasi internal
import toast from 'react-hot-toast'; // <<< PASTIKAN INI DIIMPORT

const MyQueueStatusPage = () => {
    const location = useLocation(); // Hook untuk mengakses objek lokasi (URL)
    const [email, setEmail] = useState(''); // State untuk email yang akan dicari
    const [queueStatus, setQueueStatus] = useState(null); // Menyimpan objek status antrian dari backend
    const [loading, setLoading] = useState(false); // Status loading saat mencari antrian
    const [actionLoading, setActionLoading] = useState(false); // Loading state untuk tombol aksi (misal: requeue)
    // const [error, setError] = useState(''); // <<< DIHAPUS, karena diganti toast.error
    // const [successMessage, setSuccessMessage] = useState(''); // <<< DIHAPUS, karena diganti toast.success

    // --- useEffect: Mengambil Email dari URL Query Parameter ---
    // Akan berjalan saat komponen dimuat atau URL query berubah
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const emailFromUrl = queryParams.get('email'); // Mengambil nilai 'email' dari '?email=...'
        if (emailFromUrl) {
            setEmail(emailFromUrl); // Set email ke state
            fetchQueueStatus(emailFromUrl); // Langsung cari status antrian jika email ada di URL
        }
    }, [location.search]); // Dependensi: hanya re-run jika string query berubah

    // --- Fungsi: Mengambil Status Antrian dari Backend ---
    const fetchQueueStatus = async (currentEmail) => {
        if (!currentEmail) return; // Jangan fetch jika email kosong

        setLoading(true); // Mulai loading
        // setError(''); // Dihapus, error akan ditampilkan melalui toast
        // setSuccessMessage(''); // Dihapus, sukses akan ditampilkan melalui toast

        try {
            // Panggil API untuk mendapatkan status antrian pribadi
            const data = await getMyQueueStatus(currentEmail); 
            setQueueStatus(data); // Simpan data ke state
            // Jika berhasil menemukan antrian, tampilkan toast sukses
            if (data && data.queue) {
                toast.success(`Status antrian Anda (${data.queue.full_queue_number}) berhasil dimuat.`);
            } else {
                toast.info(`Tidak ditemukan antrian aktif untuk email "${currentEmail}" hari ini.`);
            }
        } catch (err) {
            console.error('Gagal mengambil status antrian saya:', err);
            setQueueStatus(null); // Reset status jika ada error
            // Tampilkan toast error jika gagal
            toast.error(err.response?.data?.message || err.message || 'Gagal memuat status antrian. Silakan coba lagi.');
        } finally {
            setLoading(false); // Hentikan loading
        }
    };

    // --- Handler: Submit Formulir Email ---
    const handleSubmit = (e) => {
        e.preventDefault(); // Mencegah refresh halaman
        fetchQueueStatus(email); // Panggil fungsi fetch dengan email yang ada di state
    };

    // --- Handler: "Ambil Ulang Antrian" (Requeue Missed) ---
    const handleRequeue = async () => {
        // Validasi dasar
        if (!queueStatus?.queue?.id || !queueStatus?.queue?.service_id || queueStatus.queue.status !== 'missed') {
            toast.error('Data antrian tidak valid untuk ambil ulang.');
            return;
        }
        // Konfirmasi pengguna
        if (!window.confirm('Apakah Anda yakin ingin mengambil ulang antrian ini? Anda akan mendapatkan nomor antrian baru di urutan terakhir.')) {
            return;
        }

        setActionLoading(true); // Mulai loading untuk aksi
        // setError(''); // Dihapus
        // setSuccessMessage(''); // Dihapus
        
        try {
            // Panggil API untuk mengambil ulang antrian
            const response = await requeueMissed({
                customer_email: email,
                service_id: queueStatus.queue.service_id
            });
            
            // Setelah berhasil requeue, panggil ulang fetchQueueStatus untuk mendapatkan data terbaru dan akurat
            await fetchQueueStatus(email); 
            toast.success(response.message || 'Antrian berhasil diambil ulang!'); // Tampilkan toast sukses

        } catch (err) {
            console.error('Gagal mengambil ulang antrian:', err);
            toast.error(err.response?.data?.message || err.message || 'Gagal mengambil ulang antrian. Silakan coba lagi.');
        } finally {
            setActionLoading(false); // Hentikan loading
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Status Antrian Anda</h2>
                
                {/* Area Pesan (Loading, Error, Sukses) kini ditangani oleh react-hot-toast, kecuali aksi loading */}
                {/* {error && ( ... )} */}
                {/* {successMessage && ( ... )} */}
                {loading && <p className="text-blue-500 text-center mb-4">Mencari status antrian...</p>}
                {actionLoading && <p className="text-indigo-500 text-center mb-4">Memproses permintaan...</p>}

                {/* Formulir Input Email */}
                <form onSubmit={handleSubmit} className="mb-8 p-4 border border-gray-200 rounded-lg">
                    <label htmlFor="emailInput" className="block text-sm font-medium text-gray-700 mb-2">
                        Masukkan Email Anda:
                    </label>
                    <div className="flex space-x-2">
                        <input
                            type="email"
                            id="emailInput"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nama@email.com"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-2 px-3"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
                            disabled={loading}
                        >
                            Cari Antrian
                        </button>
                    </div>
                </form>

                {/* Tampilan Status Antrian */}
                {/* Tampilkan jika tidak loading, tidak ada error (dari toast), dan ada data antrian */}
                {!loading && !actionLoading && queueStatus && queueStatus.queue ? ( 
                    <div className="bg-white p-6 rounded-lg border border-gray-200 text-center shadow-md">
                        <p className="text-gray-700 text-lg mb-2">Nomor Antrian Anda:</p>
                        <p className="text-6xl font-extrabold text-blue-800 mb-4">{queueStatus.queue.full_queue_number}</p>
                        {/* Menampilkan service_name menggunakan optional chaining karena service adalah relasi */}
                        <p className="text-xl text-gray-700">Layanan: <span className="font-semibold">{queueStatus.queue.service?.service_name || 'N/A'}</span></p> 
                        <p className="text-xl text-gray-700 mb-4">Status: <span className={`font-semibold capitalize 
                            ${queueStatus.queue.status === 'calling' ? 'text-red-600' : 
                                queueStatus.queue.status === 'waiting' ? 'text-blue-600' : 
                                queueStatus.queue.status === 'on_hold' ? 'text-yellow-600' : 'text-gray-600'}`
                            }>
                                {queueStatus.queue.status.replace('_', ' ')}
                            </span>
                        </p>
                        
                        {/* Tampilkan detail posisi jika statusnya 'waiting' atau 'on_hold' */}
                        {['waiting', 'on_hold'].includes(queueStatus.queue.status) && (
                            <>
                                <p className="text-gray-700 text-lg mt-4">Antrian di Depan: <span className="font-semibold">{queueStatus.queues_in_front}</span></p>
                                <p className="text-gray-700 text-lg">Estimasi Waktu Tunggu: <span className="font-semibold">{queueStatus.estimated_wait_time}</span></p>
                                <p className="text-gray-700 text-sm mt-2">Nomor Sedang Dipanggil: <span className="font-semibold">{queueStatus.current_calling_number}</span></p>
                            </>
                        )}
                        {/* Pesan spesifik berdasarkan status */}
                        {queueStatus.queue.status === 'calling' && (
                            <p className="text-green-600 text-xl font-semibold mt-4">Silakan menuju loket sekarang!</p>
                        )}
                        {queueStatus.queue.status === 'completed' && (
                            <p className="text-green-700 text-xl font-semibold mt-4">Layanan Anda telah selesai.</p>
                        )}
                        {queueStatus.queue.status === 'expired' && (
                            <p className="text-red-700 text-xl font-semibold mt-4">Antrian Anda telah kadaluarsa. Silakan daftar antrian baru.</p>
                        )}


                        {/* Tombol Ambil Ulang Antrian jika statusnya 'missed' */}
                        {queueStatus.queue.status === 'missed' && (
                            <button
                                onClick={handleRequeue}
                                className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Memproses...' : 'Ambil Ulang Antrian'}
                            </button>
                        )}
                    </div>
                ) : (
                    // Pesan jika tidak ada antrian ditemukan atau belum mencari
                    !loading && !actionLoading && ( // Hapus !error dari kondisi
                        <p className="text-center text-gray-600">
                            {email ? `Tidak ditemukan antrian aktif untuk email "${email}" hari ini.` : 'Masukkan email Anda untuk melihat status antrian.'}
                        </p>
                    )
                )}

                {/* Navigasi Footer */}
                <div className="text-center mt-8 space-x-4">
                    <Link to="/register-queue" className="text-blue-600 hover:underline">Daftar Antrian Baru</Link>
                    <span className="text-gray-400">|</span>
                    <Link to="/status-display" className="text-blue-600 hover:underline">Lihat Status Antrian Publik</Link>
                </div>
            </div>
        </div>
    );
};

export default MyQueueStatusPage;