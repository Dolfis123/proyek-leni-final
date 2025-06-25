// src/pages/public/QueueStatusDisplayPage.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import socket from '../../api/socket';
import { getPublicQueueStatusAPI } from '../../api/queue';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const QueueStatusDisplayPage = () => {
    const [publicStatus, setPublicStatus] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(4);

    const effectRan = useRef(false);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const data = await getPublicQueueStatusAPI();
            setPublicStatus(data);
            console.log('Initial API data fetched:', data);
            return true;
        } catch (err) {
            console.error('Gagal mengambil status antrian publik awal:', err);
            const msg = err.message || 'Gagal memuat status antrian publik.';
            toast.error(msg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('[QueueStatusDisplayPage] useEffect triggered');

        if (effectRan.current === false) {
            const loadInitialData = async () => {
                const success = await fetchInitialData();
                if (success) {
                    console.log('[QueueStatusDisplayPage] Initial data loaded, attempting to show toast');
                }
            };
            loadInitialData();
            effectRan.current = true;
        }

        socket.on('queue_update', (data) => {
            console.log('Menerima update antrian real-time dari socket:', data);
            setPublicStatus(data);
            setCurrentPage(1); // Reset halaman ke 1 setiap kali ada update real-time
        });

        return () => {
            socket.off('queue_update');
            console.log('[QueueStatusDisplayPage] useEffect cleanup triggered');
        };
    }, []);

    const filteredServices = useMemo(() => {
        if (!searchQuery) {
            return publicStatus;
        }
        return publicStatus.filter(service =>
            service.service_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [publicStatus, searchQuery]);

    const indexOfLastService = currentPage * itemsPerPage;
    const indexOfFirstService = indexOfLastService - itemsPerPage;
    const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService);

    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

    const handleNextPage = () => {
        setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
    };

    const handlePrevPage = () => {
        setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-800 text-white">
                <p className="text-xl text-white">Memuat status antrian real-time...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-8">
            <header className="text-center mb-10">
                <h1 className="text-5xl font-extrabold mb-2 tracking-wide">Pengadilan Negeri Manokwari</h1>
                <p className="text-2xl font-semibold text-purple-200">Sistem Antrian Real-time</p>
            </header>

    <div className="mb-10 p-6 bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/30">
    {/* Input Pencarian */}
    <div className="relative w-full md:w-1/2">
        <input
            type="text"
            placeholder="Cari Layanan Antrian..."
            value={searchQuery}
            onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-transparent bg-white/80 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-transparent transition-all duration-300 font-medium"
        />
        {/* Ikon Pencarian */}
        <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
        </svg>
    </div>
    
    {/* Tautan Navigasi sebagai Tombol */}
    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
        <Link
            to="/login"
            className="w-full text-center md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold tracking-wide transition-all duration-300 transform hover:scale-105 shadow-xl"
        >
            Login Admin
        </Link>
        <Link
            to="/register-queue"
            className="w-full text-center md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold tracking-wide transition-all duration-300 transform hover:scale-105 shadow-xl"
        >
            Daftar Antrian Baru
        </Link>
    </div>
</div>

            <main>
                {currentServices.length === 0 && !loading ? (
                    <div className="text-center bg-white bg-opacity-20 p-8 rounded-lg shadow-xl">
                        <p className="text-3xl font-bold">Tidak ada antrian aktif yang cocok dengan pencarian Anda.</p>
                        <p className="text-lg mt-2">Coba kata kunci lain atau daftar antrian baru.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {currentServices.map(service => (
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
                                </div>
                            ))}
                        </div>

                        {filteredServices.length > itemsPerPage && (
                            <div className="flex justify-center items-center mt-10 space-x-4">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1 || loading}
                                    className="px-6 py-3 rounded-lg font-semibold text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                                >
                                    &larr; Sebelumnya
                                </button>
                                <span className="text-xl font-medium text-white">Halaman {currentPage} dari {totalPages}</span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages || loading}
                                    className="px-6 py-3 rounded-lg font-semibold text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                                >
                                    Berikutnya &rarr;
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <footer className="text-center mt-12 text-gray-300 text-sm">
                &copy; {new Date().getFullYear()} Pengadilan Negeri Manokwari. Powered by Your App.
            </footer>
        </div>
    );
};

export default QueueStatusDisplayPage;