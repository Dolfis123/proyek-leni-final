// src/pages/superadmin/QueueReportsPage.jsx
import React, { useState, useEffect, useRef } from 'react'; 
import DashboardLayout from '../../components/common/DashboardLayout'; 
import { getQueueReport } from '../../api/queue'; 
import { getAllServices } from '../../api/services'; 
import toast from 'react-hot-toast'; 

// <<< BARU: Import library untuk generate PDF >>>
import html2canvas from 'html2canvas'; 
import jsPDF from 'jspdf';           

const QueueReportsPage = () => {
    // State untuk menyimpan data laporan yang diterima dari backend
    const [reportData, setReportData] = useState([]);
    // State untuk menyimpan daftar layanan yang akan digunakan di dropdown filter
    const [services, setServices] = useState([]);
    // State untuk indikator loading saat mengambil laporan
    const [loading, setLoading] = useState(false);
    // State untuk pesan error jika pengambilan laporan gagal (sekarang ditampilkan melalui toast)
    const [error, setError] = useState(''); // DIKONDISIKAN UNTUK JSX TERTENTU, tapi toast utamanya

    // State untuk parameter filter laporan
    const [startDate, setStartDate] = useState('');     // Tanggal mulai filter (YYYY-MM-DD)
    const [endDate, setEndDate] = useState('');         // Tanggal akhir filter (YYYY-MM-DD)
    const [selectedServiceId, setSelectedServiceId] = useState(''); // ID layanan yang dipilih untuk filter

    // useRef untuk melacak apakah useEffect sudah dieksekusi (untuk menghindari double toast di StrictMode)
    const effectRan = useRef(false); 
    // <<< BARU: useRef untuk mereferensikan elemen HTML yang akan di-export ke PDF >>>
    const reportTableRef = useRef(null); 

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
        // Validasi: pastikan tanggal mulai dan akhir sudah dipilih
        if (!startDate || !endDate) {
            toast.warn('Mohon pilih tanggal mulai dan tanggal akhir.'); 
            setReportData([]); 
            return;
        }

        setLoading(true); 
        setError(''); // Reset error state

        try {
            const data = await getQueueReport(startDate, endDate, selectedServiceId || null);
            setReportData(data); // Simpan data laporan ke state
            console.log('Data laporan berhasil diambil:', data);
            toast.success('Data laporan berhasil dimuat!'); 
        } catch (err) {
            console.error('Gagal mengambil laporan:', err);
            const msg = err.response?.data?.message || err.message || 'Gagal memuat data laporan.';
            setError(msg); // Set error state, meskipun toast juga akan ditampilkan
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

    // --- BARU: Fungsi untuk Generate PDF ---
    const handleGeneratePdf = async () => {
        // Pastikan ada data laporan yang akan di-export
        if (reportData.length === 0) {
            toast.warn('Tidak ada data laporan untuk diekspor ke PDF.');
            return;
        }

        // Pastikan elemen tabel bisa diakses melalui ref
        if (reportTableRef.current) {
            toast('Sedang membuat PDF, mohon tunggu...', { duration: 5000 }); // Toast durasi lebih panjang
            
            // Mengubah elemen HTML menjadi kanvas
            const canvas = await html2canvas(reportTableRef.current, { scale: 2 }); // Scale 2 untuk resolusi lebih baik
            const imgData = canvas.toDataURL('image/png'); // Mengonversi kanvas ke base64 image

            // Membuat dokumen PDF
            const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for units, 'a4' for size (210x297mm)
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width; // Menghitung tinggi gambar sesuai lebar A4
            let heightLeft = imgHeight; // Sisa tinggi gambar yang belum ditambahkan ke PDF

            let position = 0; // Posisi vertikal di halaman PDF

            // Menambahkan gambar ke halaman pertama
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight; // Kurangi tinggi halaman yang sudah terisi

            // Jika gambar lebih panjang dari satu halaman, tambahkan halaman baru
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight; // Hitung posisi untuk gambar di halaman berikutnya
                pdf.addPage(); // Tambahkan halaman baru
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight); // Tambahkan gambar lagi
                heightLeft -= pageHeight;
            }

            // Menyimpan file PDF
            pdf.save(`Laporan_Antrian_${startDate}_${endDate}.pdf`); 
            toast.success('Laporan PDF berhasil dibuat!');
        } else {
            toast.error('Gagal membuat PDF: Tabel laporan tidak ditemukan.');
        }
    };


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
                {/* <<< BARU: Tombol Export to PDF >>> */}
                <button
                    onClick={handleGeneratePdf}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 mt-4"
                    disabled={loading || reportData.length === 0} // Nonaktif saat loading atau data kosong
                >
                    Export to PDF
                </button>
            </div>

            {/* Area Pesan (Loading, Error) */}
            {loading && <p className="text-blue-500 text-center">Memuat data laporan...</p>}
            {error && <p className="text-red-500 text-center">{error}</p>} 

            {/* Tampilan Tabel Laporan */}
            {/* Bungkus tabel dengan div yang memiliki ref reportTableRef */}
            {!loading && !error && reportData.length > 0 ? ( 
                <div ref={reportTableRef} className="bg-white p-6 rounded-lg shadow-md"> {/* <<< TAMBAHKAN ref INI */}
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