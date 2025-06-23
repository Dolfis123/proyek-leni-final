// src/pages/public/QueueStatusDisplayPage.jsx
import React, { useEffect, useState } from 'react';
import socket from '../../api/socket'; // Import Socket.IO client
import { getPublicQueueStatusAPI } from '../../api/queue'; // Untuk fetch awal jika socket lambat

const QueueStatusDisplayPage = () => {
    const [publicStatus, setPublicStatus] = useState([]); // Data antrian publik
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fungsi untuk fetch data awal
        const fetchInitialData = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await getPublicQueueStatusAPI();
                setPublicStatus(data);
            } catch (err) {
                console.error('Failed to fetch initial public queue status:', err);
                setError(err.message || 'Failed to load public queue status.');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        // Listen for real-time updates from Socket.IO
        socket.on('queue_update', (data) => {
            console.log('Received real-time queue update:', data);
            // 'data' dari backend akan berisi { activeQueues, callingQueues } atau format yang sama dengan getPublicQueueStatusAPI
            // Sesuaikan jika format data dari socket berbeda
            setPublicStatus(data); // Asumsi format data dari socket sama dengan API fetch
        });

        // Clean up on component unmount
        return () => {
            socket.off('queue_update'); // Hentikan mendengarkan event
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-xl text-blue-600">Loading real-time queue status...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-xl text-red-600">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-8">
            <header className="text-center mb-10">
                <h1 className="text-5xl font-extrabold mb-2 tracking-wide">Pengadilan Negeri Manokwari</h1>
                <p className="text-2xl font-semibold text-purple-200">Sistem Antrian Real-time</p>
            </header>

            <main>
                {publicStatus.length === 0 && (
                    <div className="text-center bg-white bg-opacity-20 p-8 rounded-lg shadow-xl">
                        <p className="text-3xl font-bold">Tidak ada antrian aktif saat ini.</p>
                        <p className="text-lg mt-2">Silakan daftar antrian baru.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {publicStatus.map(service => (
                        <div key={service.service_name} className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white border-opacity-30">
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
                            {/* Anda bisa menampilkan daftar antrian menunggu di sini jika diinginkan */}
                            {/* <div className="mt-4">
                                <h3 className="text-lg font-semibold mb-2">Daftar Menunggu:</h3>
                                <ul className="list-disc list-inside text-sm">
                                    {service.queues.filter(q => q.status === 'waiting').slice(0, 5).map(q => (
                                        <li key={q.id}>{q.full_queue_number} - {q.customer_name}</li>
                                    ))}
                                    {service.queues.filter(q => q.status === 'waiting').length > 5 && <li>...</li>}
                                </ul>
                            </div> */}
                        </div>
                    ))}
                </div>
            </main>

            <footer className="text-center mt-12 text-gray-300 text-sm">
                &copy; {new Date().getFullYear()} Pengadilan Negeri Manokwari. Powered by Your App.
            </footer>
        </div>
    );
};

export default QueueStatusDisplayPage;