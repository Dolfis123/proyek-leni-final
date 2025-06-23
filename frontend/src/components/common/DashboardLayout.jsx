// src/components/common/DashboardLayout.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout, getCurrentUser } from '../../api/auth'; 
import toast from 'react-hot-toast'; // <<< PASTIKAN INI DIIMPORT untuk notifikasi

// Import Icon dari react-icons
import { 
    FaHome, 
    FaUsers, 
    FaCogs, 
    FaCalendarAlt, 
    FaChartBar, 
    FaBoxOpen, 
    FaClipboardList, 
    FaSignOutAlt, 
    FaUserCircle 
} from 'react-icons/fa'; 


const DashboardLayout = ({ children, title = "Dashboard" }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getCurrentUser();

    // --- Handler: Logout Pengguna dengan Konfirmasi ---
    const handleLogout = () => {
        // <<< BARU: Tambahkan konfirmasi logout >>>
        if (window.confirm('Apakah Anda yakin ingin keluar?')) {
            logout(); // Hapus token dan data user dari localStorage
            navigate('/login'); // Arahkan pengguna kembali ke halaman login
            toast.success('Anda telah berhasil keluar.'); // Notifikasi sukses logout
        } else {
            toast.info('Logout dibatalkan.'); // Notifikasi jika logout dibatalkan
        }
    };

    // --- Fungsi: Untuk menentukan kelas aktif pada tautan navigasi ---
    const isActiveLink = (path) => {
        return location.pathname === path ? 'bg-blue-700 text-white shadow-inner' : 'hover:bg-blue-700 hover:text-white';
    };

    // --- Fungsi: Merender Navigasi Sidebar Berdasarkan Peran Pengguna ---
    const renderSidebarNav = () => {
        if (user?.role === 'super_admin') {
            return (
                <>
                    <Link to="/superadmin/dashboard" className={`flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 ${isActiveLink('/superadmin/dashboard')}`}>
                        <FaHome className="text-lg" />
                        <span>Home</span>
                    </Link>
                    <Link to="/superadmin/users" className={`flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 ${isActiveLink('/superadmin/users')}`}>
                        <FaUsers className="text-lg" />
                        <span>Kelola Pengguna</span>
                    </Link>
                    <Link to="/superadmin/services" className={`flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 ${isActiveLink('/superadmin/services')}`}>
                        <FaBoxOpen className="text-lg" />
                        <span>Kelola Layanan</span>
                    </Link>
                    <Link to="/superadmin/settings" className={`flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 ${isActiveLink('/superadmin/settings')}`}>
                        <FaCogs className="text-lg" />
                        <span>Pengaturan Sistem</span>
                    </Link>
                    <Link to="/superadmin/holidays" className={`flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 ${isActiveLink('/superadmin/holidays')}`}>
                        <FaCalendarAlt className="text-lg" />
                        <span>Kelola Hari Libur</span>
                    </Link>
                    <Link to="/superadmin/reports" className={`flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 ${isActiveLink('/superadmin/reports')}`}>
                        <FaChartBar className="text-lg" />
                        <span>Laporan Antrian</span>
                    </Link>
                </>
            );
        } 
        else if (user?.role === 'admin') {
            return (
                <>
                    <Link to="/admin/dashboard" className={`flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 ${isActiveLink('/admin/dashboard')}`}>
                        <FaHome className="text-lg" />
                        <span>Home</span>
                    </Link>
                    <Link to="/admin/queue-management" className={`flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 ${isActiveLink('/admin/queue-management')}`}>
                        <FaClipboardList className="text-lg" />
                        <span>Manajemen Antrian</span>
                    </Link>
                </>
            );
        }
        return null;
    };

    // --- Pengamanan Route: Redirect ke Login Jika Pengguna Belum Login ---
    if (!user) {
        navigate('/login'); 
        return null;
    }

    // --- Struktur Layout Utama Dashboard ---
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar Kiri */}
            <div className="w-64 bg-gradient-to-b from-blue-700 to-indigo-800 text-white flex flex-col p-4 shadow-xl"> 
                <div className="text-xl font-bold mb-6 text-center border-b border-blue-500 pb-4"> 
                    {user.role === 'super_admin' ? 'Super Admin Panel' : 'Admin Panel'}
                </div>
                {/* Area Navigasi Sidebar */}
                <nav className="flex-1 space-y-2"> 
                    {renderSidebarNav()}
                </nav>
                {/* Bagian Bawah Sidebar (Info User & Logout) */}
                <div className="mt-auto pt-4 border-t border-blue-500"> 
                    <div className="flex items-center space-x-2 text-sm text-gray-200 mb-4"> 
                        <FaUserCircle className="text-xl" /> 
                        <span>{user.full_name || user.username} ({user.role})</span>
                    </div>
                    <button
                        onClick={handleLogout} // Panggil handler logout saat tombol diklik
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-200 flex items-center justify-center space-x-2" 
                    >
                        <FaSignOutAlt className="text-lg" /> 
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Konten Utama Dashboard */}
            <div className="flex-1 flex flex-col">
                {/* Header Konten Utama */}
                <header className="bg-white shadow-md p-4 flex justify-between items-center z-10"> 
                    <h1 className="text-2xl font-bold text-gray-800">{title}</h1> 
                    {/* Anda bisa menambahkan elemen header lain di sini (misal: notifikasi, profil) */}
                </header>

                {/* Area Konten Utama (children adalah komponen halaman yang dirender di dalam layout ini) */}
                <main className="flex-1 p-6 bg-gray-50 overflow-auto"> 
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;