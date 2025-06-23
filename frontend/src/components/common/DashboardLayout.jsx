/* eslint-disable no-unused-vars */
// src/components/common/DashboardLayout.jsx
import React, { useState } from 'react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout, getCurrentUser } from '../../api/auth'; 
import toast from 'react-hot-toast'; 

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
    FaUserCircle,
    FaBars, 
    FaTimes 
} from 'react-icons/fa'; 


const DashboardLayout = ({ children, title = "Dashboard" }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getCurrentUser();

    // State untuk mengontrol visibilitas sidebar (true = terbuka lebar, false = kolaps/sembunyi)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); 


    // --- Handler: Logout Pengguna dengan Konfirmasi ---
    const handleLogout = () => {
        if (window.confirm('Apakah Anda yakin ingin keluar?')) {
            logout(); 
            navigate('/login'); 
            toast.success('Anda telah berhasil keluar.'); 
        } else {
            toast.info('Logout dibatalkan.'); 
        }
    };

    // --- Fungsi: Untuk menentukan kelas aktif pada tautan navigasi ---
    const isActiveLink = (path) => {
        // Menggunakan "active" jika path cocok, jika tidak, gunakan hover
        return location.pathname === path ? 'bg-blue-700 text-white shadow-inner' : 'hover:bg-blue-700 hover:text-white';
    };

    // --- Fungsi: Merender Navigasi Sidebar Berdasarkan Peran Pengguna ---
    // Sekarang akan menampilkan/menyembunyikan teks berdasarkan isSidebarOpen
    const renderSidebarNav = () => {
        const LinkComponent = ({ to, icon: Icon, text }) => (
            <Link to={to} className={`flex items-center space-x-3 py-2.5 px-4 rounded transition-all duration-200 ${isActiveLink(to)}`}>
                <Icon className="text-lg min-w-[20px]" /> {/* min-w untuk menjaga ukuran ikon */}
                <span className={`whitespace-nowrap overflow-hidden ${isSidebarOpen ? 'opacity-100 w-auto ml-2' : 'opacity-0 w-0 ml-0'}`}> {/* Kontrol visibilitas teks */}
                    {text}
                </span>
            </Link>
        );

        if (user?.role === 'super_admin') {
            return (
                <>
                    <LinkComponent to="/superadmin/dashboard" icon={FaHome} text="Home" />
                    <LinkComponent to="/superadmin/users" icon={FaUsers} text="Kelola Pengguna" />
                    <LinkComponent to="/superadmin/services" icon={FaBoxOpen} text="Kelola Layanan" />
                    <LinkComponent to="/superadmin/settings" icon={FaCogs} text="Pengaturan Sistem" />
                    <LinkComponent to="/superadmin/holidays" icon={FaCalendarAlt} text="Kelola Hari Libur" />
                    <LinkComponent to="/superadmin/reports" icon={FaChartBar} text="Laporan Antrian" />
                </>
            );
        } 
        else if (user?.role === 'admin') {
            return (
                <>
                    <LinkComponent to="/admin/dashboard" icon={FaHome} text="Home" />
                    <LinkComponent to="/admin/queue-management" icon={FaClipboardList} text="Manajemen Antrian" />
                </>
            );
        }
        return null;
    };

    if (!user) {
        navigate('/login'); 
        return null;
    }

    // --- Struktur Layout Utama Dashboard ---
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar Kiri */}
            {/* Styling responsif: Sidebar akan transisi lebar dan posisi */}
            <div className={`fixed inset-y-0 left-0 z-40 bg-gradient-to-b from-blue-700 to-indigo-800 text-white flex flex-col p-4 shadow-xl 
                        transition-all duration-300 ease-in-out
                        ${isSidebarOpen ? 'w-64' : 'w-20'} /* Lebar sidebar dinamis */
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}> {/* Sembunyi/slide di layar kecil, tapi selalu di posisi di md ke atas */}
                
                <div className={`text-xl font-bold mb-6 text-center border-b border-blue-500 pb-4 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}> {/* Judul sidebar dinamis */}
                    {user.role === 'super_admin' ? 'Super Admin Panel' : 'Admin Panel'}
                </div>
                {/* Area Navigasi Sidebar */}
                <nav className="flex-1 space-y-2"> 
                    {renderSidebarNav()}
                </nav>
                {/* Bagian Bawah Sidebar (Info User & Logout) */}
                <div className={`mt-auto pt-4 border-t border-blue-500 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}> 
                    <div className="flex items-center space-x-2 text-sm text-gray-200 mb-4"> 
                        <FaUserCircle className="text-xl" /> 
                        <span>{user.full_name || user.username} ({user.role})</span>
                    </div>
                    <button
                        onClick={handleLogout} 
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-200 flex items-center justify-center space-x-2" 
                    >
                        <FaSignOutAlt className="text-lg" /> 
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Overlay untuk Layar Kecil saat Sidebar Terbuka */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Konten Utama Dashboard */}
            {/* Penyesuaian margin kiri agar tidak tertutup sidebar, disesuaikan dengan lebar sidebar dinamis */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out
                        ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} /* Margin kiri dinamis */
                        ml-0`}> {/* Margin kiri 0 di layar kecil */}
                
                {/* Header Konten Utama */}
                <header className="bg-white shadow-md p-4 flex justify-between items-center z-10"> 
                    {/* Tombol Hamburger (Selalu Tampil) */}
                    <button 
                        onClick={() => setIsSidebarOpen(prev => !prev)}
                        className="text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2" // <<< SELALU TAMPIL
                    >
                        {isSidebarOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 ml-4">{title}</h1> {/* Judul halaman dinamis */}
                    {/* Anda bisa menambahkan elemen header lain di sini (misal: notifikasi, profil) */}
                    <div className="flex-1 flex justify-end"></div> {/* Mengatur elemen lain di header ke kanan */}
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