// src/pages/admin/QueueManagementPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getAllServices } from '../../api/services'; // Untuk mendapatkan daftar layanan
import { getQueuesForAdmin, callNextQueue, markQueueStatus, recallLastCalledQueue } from '../../api/queue'; // API antrian admin
import socket from '../../api/socket'; // Socket.IO client
import { getCurrentUser } from '../../api/auth'; // Untuk mendapatkan info user (adminId)

const QueueManagementPage = () => {
    const currentUser = getCurrentUser(); // Admin yang sedang login
    const [services, setServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState(''); // ID layanan/loket yang dipilih admin
    const [currentCallingQueue, setCurrentCallingQueue] = useState(null);
    const [waitingQueues, setWaitingQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false); // Loading state untuk tombol aksi

    // Fetch daftar layanan saat komponen dimuat
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const data = await getAllServices(); // Ini akan mendapatkan semua layanan (aktif/non-aktif)
                setServices(data);
                if (data.length > 0) {
                    // Set layanan pertama sebagai default jika belum ada yang dipilih
                    setSelectedServiceId(data[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch services for admin:', err);
                setError('Failed to load services for queue management.');
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    // Fetch antrian untuk layanan yang dipilih
    // Menggunakan useCallback agar tidak dibuat ulang setiap render
    const fetchQueues = useCallback(async (serviceId) => {
        if (!serviceId) return; // Jangan fetch jika belum ada layanan terpilih
        setLoading(true);
        setError('');
        try {
            const data = await getQueuesForAdmin(serviceId);
            setCurrentCallingQueue(data.currentCalling);
            setWaitingQueues(data.waitingQueues);
            console.log('Fetched queues for service', serviceId, ':', data);
        } catch (err) {
            console.error('Failed to fetch queues for admin:', err);
            setError(err.message || 'Failed to load queues for this service.');
        } finally {
            setLoading(false);
        }
    }, []); // Dependensi kosong karena tidak ada dari luar

    // Effect untuk fetch antrian saat serviceId berubah
    useEffect(() => {
        if (selectedServiceId) {
            fetchQueues(selectedServiceId);
        }
    }, [selectedServiceId, fetchQueues]); // Re-fetch jika serviceId atau fetchQueues berubah

    // Socket.IO for real-time updates
    useEffect(() => {
        // Event listener untuk update antrian (dari backend)
        socket.on('queue_update', (data) => {
            console.log('Received real-time queue update for admin:', data);
            // Data yang diterima dari socket adalah format publicStatus.
            // Kita perlu menyaringnya untuk mendapatkan data spesifik layanan yang dipilih admin.
            const updatedService = data.find(s => s.id === selectedServiceId); // Cari layanan yang cocok ID-nya
            if (updatedService) {
                // Untuk admin dashboard, kita perlu data currentCalling dan waitingQueues
                // Ini berarti backend perlu mengirim format berbeda untuk admin update, atau
                // frontend harus memproses publicStatus yang diterima menjadi format admin
                // Simplifikasi: Kita panggil ulang fetchQueues
                fetchQueues(selectedServiceId); // <--- INI SOLUSI PALING MUDAH UNTUK SEMENTARA
            }
        });

        return () => {
            socket.off('queue_update');
        };
    }, [selectedServiceId, fetchQueues]); // Re-subscribe jika layanan berubah

    // Handle Call Next Queue
    const handleCallNextQueue = async () => {
        if (!selectedServiceId) {
            alert('Please select a service first.');
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            await callNextQueue(selectedServiceId);
            await fetchQueues(selectedServiceId); // Refresh setelah aksi
            console.log('Next queue called.');
        } catch (err) {
            console.error('Failed to call next queue:', err);
            setError(err.message || 'Failed to call next queue.');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Mark Queue Status (Completed, Missed, On Hold)
    const handleMarkQueueStatus = async (queueId, status) => {
        if (!window.confirm(`Are you sure you want to mark this queue as "${status}"?`)) {
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            await markQueueStatus(queueId, status);
            await fetchQueues(selectedServiceId); // Refresh setelah aksi
            console.log(`Queue ${queueId} marked as ${status}.`);
        } catch (err) {
            console.error(`Failed to mark queue as ${status}:`, err);
            setError(err.message || `Failed to mark queue as ${status}.`);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Recall Last Called Queue
    const handleRecallLastCalledQueue = async () => {
        if (!selectedServiceId) {
            alert('Please select a service first.');
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            await recallLastCalledQueue(selectedServiceId);
            await fetchQueues(selectedServiceId); // Refresh setelah aksi
            console.log('Last called queue recalled.');
        } catch (err) {
            console.error('Failed to recall last called queue:', err);
            setError(err.message || 'Failed to recall last called queue.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <DashboardLayout title="Queue Management">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Service / Loket</h2>
                <div className="flex items-center space-x-4">
                    <label htmlFor="service-select" className="block text-sm font-medium text-gray-700">Pilih Layanan:</label>
                    <select
                        id="service-select"
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                        className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                        {loading && <option value="">Loading services...</option>}
                        {!loading && services.length === 0 && <option value="">No services available</option>}
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

            {selectedServiceId && (
                <>
                    {loading && <p className="text-blue-500 text-center">Loading queues...</p>}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {actionLoading && <p className="text-indigo-500 text-center">Processing action...</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Current Calling Queue */}
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

                        {/* Control Buttons */}
                        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Aksi Antrian</h3>
                            <button
                                onClick={handleCallNextQueue}
                                disabled={actionLoading || waitingQueues.length === 0}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 text-xl rounded-lg shadow-lg focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform duration-150 hover:scale-105"
                            >
                                {actionLoading ? 'Memanggil...' : 'Panggil Antrian Berikutnya'}
                            </button>
                            {waitingQueues.length === 0 && !loading && <p className="text-gray-500 mt-2">Tidak ada antrian menunggu.</p>}
                        </div>
                    </div>

                    {/* Waiting Queues List */}
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
                                                    {/* Admin juga bisa memanggil spesifik, tapi CallNext lebih umum */}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
            {!selectedServiceId && !loading && (
                <p className="text-gray-600 text-center mt-8">Silakan pilih layanan untuk memulai manajemen antrian.</p>
            )}
        </DashboardLayout>
    );
};

export default QueueManagementPage;