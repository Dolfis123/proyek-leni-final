// src/components/common/DashboardLayout.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Menggunakan Link untuk navigasi, useNavigate untuk logout
import { logout, getCurrentUser } from '../../api/auth'; // Mengimpor fungsi logout dan getCurrentUser dari service API

const DashboardLayout = ({ children, title = "Dashboard" }) => {
    // Hook useNavigate untuk mengarahkan pengguna setelah logout
    const navigate = useNavigate();
    // Mengambil informasi pengguna yang sedang login dari localStorage
    const user = getCurrentUser();

    // --- Handler: Logout Pengguna ---
    const handleLogout = () => {
        logout(); // Hapus token dan data user dari localStorage
        navigate('/login'); // Arahkan pengguna kembali ke halaman login
    };

    // --- Fungsi: Merender Navigasi Sidebar Berdasarkan Peran Pengguna ---
    const renderSidebarNav = () => {
        // Jika peran pengguna adalah 'super_admin', tampilkan menu Super Admin
        if (user?.role === 'super_admin') {
            return (
                <>
                    <Link to="/superadmin/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Home</Link>
                    <Link to="/superadmin/users" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Manage Users</Link>
                    <Link to="/superadmin/services" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Manage Services</Link>
                    <Link to="/superadmin/settings" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">System Settings</Link>
                    <Link to="/superadmin/holidays" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Holidays</Link>
                    {/* Tautan ke halaman laporan/analitik */}
                     <Link to="/superadmin/reports" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Reports</Link> {/* <<< PASTIKAN LINK INI ADA */}
                </>
            );
        } 
        // Jika peran pengguna adalah 'admin', tampilkan menu Admin
        else if (user?.role === 'admin') {
            return (
                <>
                    <Link to="/admin/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Home</Link>
                    {/* Tautan ke halaman manajemen antrian untuk Admin */}
                    <Link to="/admin/queue-management" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Queue Management</Link>
                </>
            );
        }
        // Jika tidak ada peran yang cocok atau user tidak ada, kembalikan null
        return null;
    };

    // --- Pengamanan Route: Redirect ke Login Jika Pengguna Belum Login ---
    if (!user) {
        navigate('/login'); // Jika tidak ada data user di localStorage, arahkan ke halaman login
        return null; // Jangan render komponen ini
    }

    // --- Struktur Layout Utama Dashboard ---
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar Kiri */}
            <div className="w-64 bg-blue-600 text-white flex flex-col p-4 shadow-lg">
                <div className="text-xl font-bold mb-6 text-center">
                    {/* Tampilkan judul panel sesuai peran */}
                    {user.role === 'super_admin' ? 'Super Admin Panel' : 'Admin Panel'}
                </div>
                {/* Area Navigasi Sidebar */}
                <nav className="flex-1">
                    {renderSidebarNav()} {/* Panggil fungsi untuk merender menu navigasi */}
                </nav>
                {/* Bagian Bawah Sidebar (Info User & Logout) */}
                <div className="mt-auto">
                    <div className="text-sm text-gray-200 mb-2">Logged in as: {user.full_name || user.username} ({user.role})</div>
                    <button
                        onClick={handleLogout} // Panggil handler logout saat tombol diklik
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Konten Utama Dashboard */}
            <div className="flex-1 flex flex-col">
                {/* Header Konten Utama */}
                <header className="bg-white shadow p-4 flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-800">{title}</h1> {/* Judul halaman dinamis */}
                    {/* Anda bisa menambahkan elemen header lain di sini (misal: notifikasi, profil) */}
                </header>

                {/* Area Konten Utama (children adalah komponen halaman yang dirender di dalam layout ini) */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;