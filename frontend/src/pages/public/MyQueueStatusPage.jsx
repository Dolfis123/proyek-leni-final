// src/pages/public/MyQueueStatusPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getMyQueueStatus, requeueMissed } from '../../api/queue';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// Icon import (contoh, jika Anda menggunakan Heroicons atau Font Awesome)
// Anda perlu menginstal library ikon jika belum. Contoh: npm install @heroicons/react
// import { ExclamationCircleIcon, CheckCircleIcon, InformationCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

const MyQueueStatusPage = () => {
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [queueStatus, setQueueStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const emailFromUrl = queryParams.get('email');
        if (emailFromUrl) {
            setEmail(emailFromUrl);
            fetchQueueStatus(emailFromUrl);
        }
    }, [location.search]);

    const fetchQueueStatus = async (currentEmail) => {
        if (!currentEmail) return;

        setLoading(true);
        try {
            const data = await getMyQueueStatus(currentEmail);
            setQueueStatus(data);
            if (data && data.queue) {
                toast.success(`Status antrian Anda (${data.queue.full_queue_number}) berhasil dimuat.`);
            } else {
                toast.info(`Tidak ditemukan antrian aktif untuk email "${currentEmail}" hari ini.`);
            }
        } catch (err) {
            console.error('Gagal mengambil status antrian saya:', err);
            setQueueStatus(null);
            toast.error(err.response?.data?.message || err.message || 'Gagal memuat status antrian. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchQueueStatus(email);
    };

    const handleRequeue = async () => {
        if (!queueStatus?.queue?.id || !queueStatus?.queue?.service_id || queueStatus.queue.status !== 'missed') {
            toast.error('Data antrian tidak valid untuk ambil ulang.');
            return;
        }
        if (!window.confirm('Apakah Anda yakin ingin mengambil ulang antrian ini? Anda akan mendapatkan nomor antrian baru di urutan terakhir.')) {
            return;
        }

        setActionLoading(true);
        try {
            const response = await requeueMissed({
                customer_email: email,
                service_id: queueStatus.queue.service_id
            });
            await fetchQueueStatus(email); // Refresh data setelah requeue
            toast.success(response.message || 'Antrian berhasil diambil ulang!');
        } catch (err) {
            console.error('Gagal mengambil ulang antrian:', err);
            toast.error(err.response?.data?.message || err.message || 'Gagal mengambil ulang antrian. Silakan coba lagi.');
        } finally {
            setActionLoading(false);
        }
    };

    // Fungsi pembantu untuk menentukan warna badge status
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'calling': return 'bg-red-500 text-white';
            case 'waiting': return 'bg-blue-500 text-white';
            case 'on_hold': return 'bg-yellow-500 text-gray-900';
            case 'completed': return 'bg-green-500 text-white';
            case 'missed': return 'bg-orange-500 text-white';
            case 'expired': return 'bg-gray-500 text-white';
            default: return 'bg-gray-300 text-gray-800';
        }
    };

    const formatStatusText = (status) => {
        return status.replace(/_/g, ' ').toUpperCase();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Status Antrian Anda</h2>

                {/* Indikator Loading untuk Pencarian atau Aksi */}
                {loading && <p className="text-blue-500 text-center mb-6 text-lg">Mencari status antrian...</p>}
                {actionLoading && <p className="text-indigo-500 text-center mb-6 text-lg">Memproses permintaan...</p>}

                {/* Formulir Input Email */}
                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                    <label htmlFor="emailInput" className="block text-md font-semibold text-gray-700 mb-3">
                        Cari Status Antrian Anda:
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            id="emailInput"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nama@email.com"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-2.5 px-4 text-gray-800"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition duration-200 transform hover:scale-105"
                            disabled={loading || actionLoading}
                        >
                            Cari
                        </button>
                    </div>
                </form>

                {/* Tampilan Status Antrian (Jika Ditemukan) */}
                {!loading && !actionLoading && queueStatus && queueStatus.queue ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-8 rounded-xl border border-blue-200 text-center shadow-lg transform hover:scale-[1.02] transition-transform duration-300">
                        <p className="text-gray-700 text-lg mb-2 font-medium">Nomor Antrian Anda:</p>
                        <p className="text-7xl sm:text-8xl font-extrabold text-blue-800 mb-4 animate-pulseIn">
                            {queueStatus.queue.full_queue_number}
                        </p>
                        <p className="text-xl text-gray-700 mb-4">
                            Layanan: <span className="font-semibold text-indigo-700">{queueStatus.queue.service?.service_name || 'N/A'}</span>
                        </p>

                        <div className="flex items-center justify-center mb-6">
                            <span className={`px-4 py-1.5 rounded-full text-md font-bold ${getStatusBadgeClass(queueStatus.queue.status)}`}>
                                {formatStatusText(queueStatus.queue.status)}
                            </span>
                        </div>
                        
                        {/* Detail Posisi dan Estimasi Waktu Tunggu */}
                        {['waiting', 'on_hold'].includes(queueStatus.queue.status) && (
                            <div className="space-y-2 text-gray-700">
                                <p className="text-lg">
                                    Antrian di Depan: <span className="font-semibold text-blue-700">{queueStatus.queues_in_front}</span>
                                </p>
                                <p className="text-lg">
                                    Estimasi Waktu Tunggu: <span className="font-semibold text-blue-700">{queueStatus.estimated_wait_time}</span>
                                </p>
                                <p className="text-md text-gray-600 pt-2">
                                    Nomor Sedang Dipanggil: <span className="font-semibold">{queueStatus.current_calling_number || 'Belum ada'}</span>
                                </p>
                            </div>
                        )}

                        {/* Pesan Spesifik Berdasarkan Status */}
                        {queueStatus.queue.status === 'calling' && (
                            <p className="text-green-600 text-2xl font-bold mt-6 animate-bounce">
                                Silakan menuju loket sekarang! 🚀
                            </p>
                        )}
                        {queueStatus.queue.status === 'completed' && (
                            <p className="text-green-700 text-xl font-semibold mt-6">
                                Layanan Anda telah selesai. Terima kasih! ✅
                            </p>
                        )}
                        {queueStatus.queue.status === 'expired' && (
                            <p className="text-red-700 text-xl font-semibold mt-6">
                                Antrian Anda telah kadaluarsa. Silakan daftar antrian baru. ⚠️
                            </p>
                        )}
                        {queueStatus.queue.status === 'missed' && (
                             <p className="text-orange-700 text-xl font-semibold mt-6">
                                Anda telah melewatkan antrian. Silakan ambil ulang jika masih ingin dilayani.
                            </p>
                        )}


                        {/* Tombol Ambil Ulang Antrian jika statusnya 'missed' */}
                        {queueStatus.queue.status === 'missed' && (
                            <button
                                onClick={handleRequeue}
                                className="mt-8 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 px-8 rounded-lg shadow-xl transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Memproses...' : 'Ambil Ulang Antrian Sekarang'}
                            </button>
                        )}
                    </div>
                ) : (
                    // Pesan jika tidak ada antrian ditemukan atau belum mencari
                    !loading && !actionLoading && (
                        <div className="text-center bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
                             <p className="text-gray-600 text-lg">
                                {email ? `Tidak ditemukan antrian aktif untuk email "${email}" hari ini.` : 'Masukkan email Anda untuk melihat status antrian.'}
                            </p>
                            <p className="text-gray-500 text-sm mt-2">
                                Pastikan email yang Anda masukkan benar dan Anda telah mendaftar antrian hari ini.
                            </p>
                        </div>
                    )
                )}

                {/* Navigasi Footer */}
                <div className="text-center mt-10 flex flex-wrap justify-center gap-4">
                    <Link
                        to="/register-queue"
                        className="flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors duration-200 shadow-md"
                    >
                        {/* <PencilSquareIcon className="h-5 w-5 mr-2" /> Contoh ikon */}
                        Daftar Antrian Baru
                    </Link>
                    <Link
                        to="/status-display"
                        className="flex items-center px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors duration-200 shadow-md"
                    >
                        {/* <EyeIcon className="h-5 w-5 mr-2" /> Contoh ikon */}
                        Lihat Status Antrian Publik
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MyQueueStatusPage;