// src/pages/superadmin/QueueReportsPage.jsx
import React, { useState, useEffect, useRef } from 'react'; 
import DashboardLayout from '../../components/common/DashboardLayout'; 
import { getQueueReport } from '../../api/queue'; 
import { getAllServices } from '../../api/services'; 
import toast from 'react-hot-toast'; 

const QueueReportsPage = () => {
    const [reportData, setReportData] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    // const [error, setError] = useState(''); // Dihapus, diganti toast.error

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');

    const effectRan = useRef(false); 

    // --- useEffect: Mengambil Daftar Layanan untuk Dropdown Filter ---
    useEffect(() => {
        const fetchServicesForFilter = async () => { 
            try {
                const data = await getAllServices(); 
                setServices(data);
            } catch (err) {
                console.error('Gagal mengambil daftar layanan untuk filter laporan:', err);
                toast.error(err.response?.data?.message || 'Gagal memuat daftar layanan untuk filter laporan.'); 
            }
        };
        fetchServicesForFilter(); 
    }, []); 

    // --- Fungsi: Mengambil Data Laporan dari Backend ---
    const fetchReport = async () => {
        if (!startDate || !endDate) {
            toast.warn('Mohon pilih tanggal mulai dan tanggal akhir.'); 
            setReportData([]); 
            return;
        }

        setLoading(true); 
        // setError(''); // Dihapus

        try {
            const data = await getQueueReport(startDate, endDate, selectedServiceId || null);
            setReportData(data); 
            console.log('Data laporan berhasil diambil:', data);
            toast.success('Data laporan berhasil dimuat!'); 
        } catch (err) {
            console.error('Gagal mengambil laporan:', err);
            const msg = err.response?.data?.message || err.message || 'Gagal memuat data laporan.';
            toast.error(msg); 
        } finally {
            setLoading(false); 
        }
    };

    // --- useEffect: Mengatur Rentang Tanggal Default dan Memicu Pengambilan Laporan ---
    useEffect(() => {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6); 

        setEndDate(today.toISOString().slice(0, 10)); 
        setStartDate(sevenDaysAgo.toISOString().slice(0, 10)); 
    }, []); 

    // --- useEffect: Memicu Pengambilan Laporan Saat Filter Berubah ---
    useEffect(() => {
        // DEBUGGING: Log setiap kali useEffect ini dieksekusi
        console.log('[QueueReportsPage] useEffect (fetchReport) triggered');

        const loadReportOnFilterChange = async () => {
            if (effectRan.current === false) {
                effectRan.current = true; 
                if (startDate && endDate) { 
                    fetchReport();
                }
            } else {
                if (startDate && endDate) { 
                    fetchReport();
                }
            }
        };
        loadReportOnFilterChange();
    }, [startDate, endDate, selectedServiceId]); 


    // DEBUGGING: Log setiap kali komponen dirender
    console.log('[QueueReportsPage] Component Render');

    return (
        <DashboardLayout title="Queue Reports & Analytics">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Filter Laporan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Input Tanggal Mulai */}
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Tanggal Mulai:</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                    </div>
                    {/* Input Tanggal Akhir */}
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Tanggal Akhir:</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                    </div>
                    {/* Dropdown Filter Layanan */}
                    <div>
                        <label htmlFor="serviceFilter" className="block text-sm font-medium text-gray-700">Filter berdasarkan Layanan:</label>
                        <select
                            id="serviceFilter"
                            value={selectedServiceId}
                            onChange={(e) => setSelectedServiceId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        >
                            <option value="">Semua Layanan</option>
                            {services.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.service_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Area Pesan (Loading, Error) */}
            {loading && <p className="text-blue-500 text-center">Memuat data laporan...</p>}
            {/* Error global sekarang ditangani oleh react-hot-toast, jadi tidak lagi ditampilkan secara inline */}
            {/* {error && <p className="text-red-500 text-center">{error}</p>} */}

            {/* Tampilan Tabel Laporan */}
            {/* Tampilkan tabel hanya jika tidak loading, tidak ada error, dan ada data */}
            {!loading && reportData.length > 0 ? ( // Hapus `!error` dari kondisi ini
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Ringkasan Laporan</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Layanan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Antrian</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selesai</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terlewat</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tertunda</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rata-rata Waktu Tunggu (menit)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rata-rata Waktu Pelayanan (menit)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.map((row, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{new Date(row.date).toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.service_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.total_queues}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.completed_queues}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.missed_queues}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.on_hold_queues}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {row.avg_waiting_time_minutes !== null && row.avg_waiting_time_minutes !== undefined 
                                                ? Number(row.avg_waiting_time_minutes).toFixed(2) 
                                                : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {row.avg_service_time_minutes !== null && row.avg_service_time_minutes !== undefined 
                                                ? Number(row.avg_service_time_minutes).toFixed(2) 
                                                : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // Pesan jika tidak ada data laporan ditemukan atau filter belum lengkap
                !loading && ( // Hapus `!error` dari kondisi ini
                    <p className="text-center text-gray-600 mt-8">
                        {startDate && endDate ? 'Tidak ditemukan data laporan untuk rentang tanggal dan filter yang dipilih.' : 'Mohon pilih tanggal mulai dan tanggal akhir untuk membuat laporan.'}
                    </p>
                )
            )}
        </DashboardLayout>
    );
};

export default QueueReportsPage;