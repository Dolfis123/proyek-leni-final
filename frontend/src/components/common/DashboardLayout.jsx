// src/components/common/DashboardLayout.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // <<< TAMBAHKAN useLocation
import { logout, getCurrentUser } from '../../api/auth'; 

// <<< BARU: Import Icon dari react-icons >>>
// Kita akan menggunakan ikon dari Font Awesome (Fa)
import { 
    FaHome, 
    FaUsers, 
    FaCogs, 
    FaCalendarAlt, 
    FaChartBar, 
    FaBoxOpen, // Untuk services
    FaClipboardList, // Untuk Queue Management
    FaSignOutAlt, // Untuk Logout
    FaUserCircle // Untuk avatar user
} from 'react-icons/fa'; // Pastikan Anda menginstal Font Awesome icons


const DashboardLayout = ({ children, title = "Dashboard" }) => {
    const navigate = useNavigate();
    const location = useLocation(); // <<< BARU: Hook useLocation untuk mengetahui path saat ini
    const user = getCurrentUser();

    const handleLogout = () => {
        logout(); 
        navigate('/login'); 
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

    if (!user) {
        navigate('/login'); 
        return null;
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar Kiri */}
            <div className="w-64 bg-gradient-to-b from-blue-700 to-indigo-800 text-white flex flex-col p-4 shadow-xl"> {/* <<< Styling baru */}
                <div className="text-xl font-bold mb-6 text-center border-b border-blue-500 pb-4"> {/* <<< Styling baru */}
                    {user.role === 'super_admin' ? 'Super Admin Panel' : 'Admin Panel'}
                </div>
                {/* Area Navigasi Sidebar */}
                <nav className="flex-1 space-y-2"> {/* Menambah space-y untuk jarak antar link */}
                    {renderSidebarNav()}
                </nav>
                {/* Bagian Bawah Sidebar (Info User & Logout) */}
                <div className="mt-auto pt-4 border-t border-blue-500"> {/* <<< Styling baru */}
                    <div className="flex items-center space-x-2 text-sm text-gray-200 mb-4"> {/* <<< Styling baru */}
                        <FaUserCircle className="text-xl" /> {/* <<< Icon User */}
                        <span>{user.full_name || user.username} ({user.role})</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-200 flex items-center justify-center space-x-2" // <<< Styling baru
                    >
                        <FaSignOutAlt className="text-lg" /> {/* <<< Icon Logout */}
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Konten Utama Dashboard */}
            <div className="flex-1 flex flex-col">
                {/* Header Konten Utama */}
                <header className="bg-white shadow-md p-4 flex justify-between items-center z-10"> {/* <<< Styling baru */}
                    <h1 className="text-2xl font-bold text-gray-800">{title}</h1> {/* Judul halaman dinamis */}
                    {/* Anda bisa menambahkan elemen header lain di sini (misal: notifikasi, profil) */}
                </header>

                {/* Area Konten Utama (children adalah komponen halaman yang dirender di dalam layout ini) */}
                <main className="flex-1 p-6 bg-gray-50 overflow-auto"> {/* <<< Styling baru */}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;