// src/pages/superadmin/QueueReportsPage.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout'; // Layout dasar dashboard
import { getQueueReport } from '../../api/queue'; // Fungsi API untuk mengambil laporan
import { getAllServices } from '../../api/services'; // Fungsi API untuk mengambil daftar layanan (untuk filter)

const QueueReportsPage = () => {
    // State untuk menyimpan data laporan yang diterima dari backend
    const [reportData, setReportData] = useState([]);
    // State untuk menyimpan daftar layanan yang akan digunakan di dropdown filter
    const [services, setServices] = useState([]);
    // State untuk indikator loading saat mengambil laporan
    const [loading, setLoading] = useState(false);
    // State untuk pesan error jika pengambilan laporan gagal
    const [error, setError] = useState('');

    // State untuk parameter filter laporan
    const [startDate, setStartDate] = useState('');     // Tanggal mulai filter
    const [endDate, setEndDate] = useState('');         // Tanggal akhir filter
    const [selectedServiceId, setSelectedServiceId] = useState(''); // ID layanan yang dipilih untuk filter

    // --- useEffect: Mengambil Daftar Layanan untuk Dropdown Filter ---
    useEffect(() => {
        const fetchServices = async () => {
            try {
                // Mengambil semua layanan (termasuk yang tidak aktif) untuk opsi filter
                const data = await getAllServices();
                setServices(data);
            } catch (err) {
                console.error('Gagal mengambil daftar layanan untuk filter laporan:', err);
            }
        };
        fetchServices(); // Panggil fungsi saat komponen pertama kali dimuat
    }, []); // Dependensi kosong, hanya berjalan sekali saat mount

    // --- Fungsi: Mengambil Data Laporan dari Backend ---
    const fetchReport = async () => {
        // Validasi: pastikan tanggal mulai dan akhir sudah dipilih
        if (!startDate || !endDate) {
            setError('Mohon pilih tanggal mulai dan tanggal akhir.');
            setReportData([]); // Kosongkan data laporan jika filter tidak lengkap
            return;
        }

        setLoading(true); // Mulai indikator loading
        setError('');     // Reset pesan error

        try {
            // Memanggil API laporan dengan parameter filter
            // selectedServiceId diubah menjadi null jika string kosong agar backend tidak memfilter
            const data = await getQueueReport(startDate, endDate, selectedServiceId || null);
            setReportData(data); // Simpan data laporan ke state
            console.log('Data laporan berhasil diambil:', data);
        } catch (err) {
            console.error('Gagal mengambil laporan:', err);
            // Menampilkan pesan error dari respons API jika ada, atau pesan default
            setError(err.response?.data?.message || err.message || 'Gagal memuat data laporan.');
        } finally {
            setLoading(false); // Hentikan indikator loading
        }
    };

    // --- useEffect: Mengatur Rentang Tanggal Default dan Memicu Pengambilan Laporan ---
    useEffect(() => {
        const today = new Date(); // Tanggal hari ini
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6); // Mengatur tanggal 6 hari ke belakang (untuk total 7 hari)

        // Mengatur tanggal akhir dan tanggal mulai dalam format YYYY-MM-DD
        setEndDate(today.toISOString().slice(0, 10)); 
        setStartDate(sevenDaysAgo.toISOString().slice(0, 10)); 
    }, []); // Efek ini hanya berjalan sekali saat komponen di-mount untuk set tanggal default

    // --- useEffect: Memicu Pengambilan Laporan Saat Filter Berubah ---
    useEffect(() => {
        // Panggil `fetchReport` setiap kali `startDate`, `endDate`, atau `selectedServiceId` berubah
        // dan pastikan kedua tanggal sudah terisi
        if (startDate && endDate) { 
            fetchReport();
        }
    }, [startDate, endDate, selectedServiceId]); // Dependensi: trigger ulang saat state ini berubah


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
                {/* Tombol Generate Report (Sekarang otomatis setelah filter dipilih, tapi bisa diaktifkan jika perlu tombol manual) */}
                {/* Anda bisa mengaktifkan tombol ini jika ingin laporan tidak otomatis ter-generate setiap perubahan filter */}
                {/* <button
                    onClick={fetchReport}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
                    disabled={loading}
                >
                    {loading ? 'Memuat Laporan...' : 'Generate Laporan'}
                </button> */}
            </div>

            {/* Area Pesan (Loading, Error) */}
            {loading && <p className="text-blue-500 text-center">Memuat data laporan...</p>}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {/* Tampilan Tabel Laporan */}
            {!loading && !error && reportData.length > 0 ? (
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
                                        {/* PERBAIKAN DI SINI: Konversi ke Number() sebelum toFixed */}
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
                !loading && !error && (
                    <p className="text-center text-gray-600 mt-8">
                        {startDate && endDate ? 'Tidak ditemukan data laporan untuk rentang tanggal dan filter yang dipilih.' : 'Mohon pilih tanggal mulai dan tanggal akhir untuk membuat laporan.'}
                    </p>
                )
            )}
        </DashboardLayout>
    );
};

export default QueueReportsPage;