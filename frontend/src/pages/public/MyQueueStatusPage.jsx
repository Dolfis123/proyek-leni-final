// src/pages/public/MyQueueStatusPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Untuk mendapatkan query params
import { getMyQueueStatus, requeueMissed } from '../../api/queue'; // Import API dari service
import { Link } from 'react-router-dom';

const MyQueueStatusPage = () => {
    const location = useLocation(); // Hook untuk mengakses objek lokasi (URL)
    const [email, setEmail] = useState('');
    const [queueStatus, setQueueStatus] = useState(null); // Menyimpan objek status antrian
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false); // Loading untuk aksi (requeue)

    // Efek untuk mengambil email dari URL query parameter saat halaman dimuat
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const emailFromUrl = queryParams.get('email');
        if (emailFromUrl) {
            setEmail(emailFromUrl);
            fetchQueueStatus(emailFromUrl);
        }
    }, [location.search]); // Hanya re-run jika string query berubah

    // Fungsi untuk mengambil status antrian dari backend
    const fetchQueueStatus = async (currentEmail) => {
        if (!currentEmail) return; // Jangan fetch jika email kosong
        setLoading(true);
        setError('');
        try {
            const data = await getMyQueueStatus(currentEmail); // Panggil API
            // Data akan berisi { message, queue, current_calling_number, queues_in_front, estimated_wait_time }
            setQueueStatus(data);
        } catch (err) {
            console.error('Failed to fetch my queue status:', err);
            setQueueStatus(null); // Reset status jika ada error
            setError(err.message || 'Failed to load queue status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handler untuk submit form email
    const handleSubmit = (e) => {
        e.preventDefault();
        fetchQueueStatus(email);
    };

    // Handler untuk "Ambil Ulang Antrian"
    const handleRequeue = async () => {
        if (!queueStatus?.queue?.id || !queueStatus?.queue?.service_id) {
            setError('Invalid queue data for requeue.');
            return;
        }
        if (!window.confirm('Apakah Anda yakin ingin mengambil ulang antrian ini? Anda akan mendapatkan nomor antrian baru di urutan terakhir.')) {
            return;
        }

        setActionLoading(true);
        setError('');
        try {
            const response = await requeueMissed({
                customer_email: email,
                service_id: queueStatus.queue.service_id
            });
            // Update status dengan informasi antrian baru
            setQueueStatus({
                ...response, // Response dari backend harus mencakup new_queue_number
                message: 'Antrian Anda berhasil diambil ulang!',
                queue: {
                    ...queueStatus.queue, // Pertahankan detail queue lama
                    status: 'waiting', // Status baru
                    full_queue_number: response.new_queue_number // Nomor antrian baru
                },
                queues_in_front: (await getMyQueueStatus(email))?.queues_in_front || 'N/A', // Update posisi baru
                estimated_wait_time: (await getMyQueueStatus(email))?.estimated_wait_time || 'N/A' // Update estimasi baru
            });
            // Anda mungkin ingin menavigasi atau memberikan konfirmasi yang lebih jelas
        } catch (err) {
            console.error('Failed to requeue:', err);
            setError(err.message || 'Failed to take new queue. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Status Antrian Anda</h2>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                {actionLoading && <p className="text-blue-500 text-center mb-4">Processing request...</p>}

                {/* Form untuk input email */}
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
                            {loading ? 'Mencari...' : 'Cari Antrian'}
                        </button>
                    </div>
                </form>

                {/* Tampilan Status Antrian */}
                {loading && !queueStatus && (
                    <p className="text-center text-blue-600">Mencari status antrian...</p>
                )}
                
                {!loading && queueStatus && queueStatus.queue && (
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
                        <p className="text-green-700 text-lg mb-2">Nomor Antrian Anda:</p>
                        <p className="text-6xl font-extrabold text-green-800 mb-4">{queueStatus.queue.full_queue_number}</p>
                        <p className="text-xl text-gray-700">Layanan: <span className="font-semibold">{queueStatus.queue.service?.service_name || 'N/A'}</span></p> {/* service.service_name dari join */}
                        <p className="text-xl text-gray-700">Status: <span className={`font-semibold capitalize ${queueStatus.queue.status === 'calling' ? 'text-red-600' : queueStatus.queue.status === 'waiting' ? 'text-blue-600' : 'text-gray-600'}`}>{queueStatus.queue.status.replace('_', ' ')}</span></p>
                        
                        {queueStatus.queue.status !== 'calling' && queueStatus.queue.status !== 'completed' && queueStatus.queue.status !== 'expired' && (
                            <>
                                <p className="text-gray-700 text-lg mt-4">Antrian di Depan: <span className="font-semibold">{queueStatus.queues_in_front}</span></p>
                                <p className="text-gray-700 text-lg">Estimasi Waktu Tunggu: <span className="font-semibold">{queueStatus.estimated_wait_time}</span></p>
                                <p className="text-gray-700 text-sm">Nomor Sedang Dipanggil: <span className="font-semibold">{queueStatus.current_calling_number}</span></p>
                            </>
                        )}

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
                )}
                {!loading && !error && !queueStatus && email && (
                    <p className="text-center text-gray-600">Tidak ditemukan antrian aktif untuk email ini hari ini.</p>
                )}
                {!loading && !error && !email && (
                    <p className="text-center text-gray-600">Masukkan email Anda untuk melihat status antrian.</p>
                )}

                <div className="text-center mt-8">
                    <Link to="/register-queue" className="text-blue-600 hover:underline">Daftar Antrian Baru</Link>
                    <span className="mx-2 text-gray-400">|</span>
                    <Link to="/status-display" className="text-blue-600 hover:underline">Lihat Status Antrian Publik</Link>
                </div>
            </div>
        </div>
    );
};

export default MyQueueStatusPage;