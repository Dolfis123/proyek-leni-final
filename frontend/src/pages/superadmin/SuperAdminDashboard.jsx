// src/pages/superadmin/SuperAdminDashboard.jsx
import React, { useEffect, useState, useRef } from 'react'; // <<< PASTIKAN useRef DIIMPORT
import DashboardLayout from '../../components/common/DashboardLayout';
import { getCurrentUser } from '../../api/auth';
import { getAllUsers } from '../../api/auth'; // Menggunakan fungsi getAllUsers dari api/auth
import { getAllServices } from '../../api/services'; // Menggunakan fungsi getAllServices dari api/services
import { getPublicQueueStatusAPI } from '../../api/queue'; // Untuk statistik antrian hari ini
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast'; // <<< PASTIKAN INI DIIMPORT

const SuperAdminDashboard = () => {
    const user = getCurrentUser(); // Mengambil informasi user yang login
    const [stats, setStats] = useState({ totalUsers: 0, totalServices: 0, todayQueues: 0 }); // State untuk statistik dashboard
    const [loading, setLoading] = useState(true); // Indikator loading data
    // const [error, setError] = useState(''); // <<< DIHAPUS, karena diganti toast.error

    const effectRan = useRef(false); // <<< BARU: useRef untuk melacak eksekusi useEffect

    // --- Fungsi: Mengambil Statistik Dashboard dari Backend ---
    const fetchDashboardStats = async () => {
        setLoading(true); // Mulai indikator loading
        try {
            // Mengambil jumlah user
            const usersResponse = await getAllUsers(); 
            
            // Mengambil jumlah layanan
            const servicesResponse = await getAllServices(); 

            // Mengambil statistik antrian hari ini
            // Menggunakan getPublicQueueStatusAPI untuk mendapatkan data antrian aktif (waiting, calling)
            const publicQueueData = await getPublicQueueStatusAPI(); 
            let totalActiveQueuesToday = 0;
            publicQueueData.forEach(service => {
                totalActiveQueuesToday += service.waiting_count; // Jumlah antrian menunggu
                if (service.calling_number !== '---' && service.calling_number !== 'Kosong') {
                    totalActiveQueuesToday += 1; // Jika ada yang sedang dipanggil, tambahkan 1
                }
            });
            // Catatan: 'totalActiveQueuesToday' ini hanya mencakup yang waiting & calling.
            // Untuk total antrian TERDAFTAR (termasuk completed, missed, dll), Anda perlu API khusus di backend.

            setStats({
                totalUsers: usersResponse.length, // .length karena getAllUsers mengembalikan array
                totalServices: servicesResponse.length, // .length karena getAllServices mengembalikan array
                todayQueues: totalActiveQueuesToday
            });
            return true; // Mengembalikan true jika fetch berhasil
        } catch (err) {
            console.error('Gagal mengambil statistik dashboard:', err);
            const msg = err.response?.data?.message || 'Gagal memuat data dashboard.';
            toast.error(msg); // <<< BARU: Toast error
            return false; // Mengembalikan false jika fetch gagal
        } finally {
            setLoading(false); // Hentikan indikator loading
        }
    };

    // --- useEffect: Memicu Pengambilan Statistik Saat Komponen Dimuat ---
    useEffect(() => {
        // DEBUGGING: Log setiap kali useEffect dieksekusi
        console.log('[SuperAdminDashboard] useEffect (loadStats) triggered');

        const loadStats = async () => {
            const success = await fetchDashboardStats(); // Panggil fetchDashboardStats
            if (success) {
                console.log('[SuperAdminDashboard] loadStats successful, attempting to show toast'); // DEBUGGING
                toast.success('Statistik dashboard berhasil dimuat!'); // <<< BARU: Panggil toast di sini hanya jika sukses
            }
        };

        // Menggunakan effectRan.current untuk memastikan loadStats hanya dijalankan sekali per mount
        if (effectRan.current === false) { 
            loadStats();
            effectRan.current = true; 
        }
        
        // Cleanup function (tidak relevan untuk kasus ini, tapi praktik baik)
        return () => {
            console.log('[SuperAdminDashboard] useEffect cleanup triggered'); // DEBUGGING
        };
    }, []); 

    // DEBUGGING: Log setiap kali komponen dirender
    console.log('[SuperAdminDashboard] Component Render'); 

    return (
        <DashboardLayout title="Super Admin Dashboard">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Selamat Datang, {user?.full_name || user?.username}!</h2>
            <p className="text-gray-600 mb-6">Ini adalah panel kontrol Super Admin Anda.</p>

            {loading && <p className="text-blue-500">Memuat statistik dashboard...</p>}
            {/* Pesan error global sekarang ditangani oleh react-hot-toast, tidak lagi ditampilkan secara inline */}
            {/* {error && <p className="text-red-500">{error}</p>} */}

            {!loading && ( // Tampilkan statistik jika tidak loading
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Total Pengguna (Admin/SuperAdmin)</h3>
                        <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Total Layanan Aktif</h3>
                        <p className="text-4xl font-bold text-green-600">{stats.totalServices}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Antrian Hari Ini (Aktif)</h3>
                        <p className="text-4xl font-bold text-purple-600">{stats.todayQueues}</p>
                    </div>
                </div>
            )}

            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link to="/superadmin/users" className="block bg-indigo-500 text-white p-4 rounded-lg shadow-md hover:bg-indigo-600 transition duration-200 text-center font-medium">
                        Kelola Pengguna
                    </Link>
                    <Link to="/superadmin/services" className="block bg-teal-500 text-white p-4 rounded-lg shadow-md hover:bg-teal-600 transition duration-200 text-center font-medium">
                        Kelola Layanan
                    </Link>
                    <Link to="/superadmin/settings" className="block bg-orange-500 text-white p-4 rounded-lg shadow-md hover:bg-orange-600 transition duration-200 text-center font-medium">
                        Pengaturan Sistem
                    </Link>
                    <Link to="/superadmin/holidays" className="block bg-rose-500 text-white p-4 rounded-lg shadow-md hover:bg-rose-600 transition duration-200 text-center font-medium">
                        Kelola Hari Libur
                    </Link>
                    <Link to="/superadmin/reports" className="block bg-gray-600 text-white p-4 rounded-lg shadow-md hover:bg-gray-700 transition duration-200 text-center font-medium">
                        Laporan Antrian
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SuperAdminDashboard;