// src/components/common/DashboardLayout.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../../../api/auth'; // Pastikan path ini sesuai dengan struktur project Anda

const DashboardLayout = ({ children, title = "Dashboard" }) => {
    const navigate = useNavigate();
    const user = getCurrentUser();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Contoh sederhana sidebar berdasarkan role
    const renderSidebarNav = () => {
        if (user?.role === 'super_admin') {
            return (
                <>
                    <Link to="/superadmin/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Home</Link>
                    <Link to="/superadmin/users" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Manage Users</Link>
                    <Link to="/superadmin/services" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Manage Services</Link>
                    <Link to="/superadmin/settings" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">System Settings</Link>
                    <Link to="/superadmin/holidays" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Holidays</Link>
                    {/* Rekap data akan ada di sini nanti */}
                    <Link to="/superadmin/reports" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Reports</Link>
                </>
            );
        } else if (user?.role === 'admin') {
            return (
                <>
                    <Link to="/admin/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Home</Link>
                    {/* Nanti ada menu untuk pengelolaan antrian di loket */}
                    <Link to="/admin/queue-management" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white">Queue Management</Link>
                </>
            );
        }
        return null;
    };

    if (!user) {
        navigate('/login'); // Redirect to login if no user is logged in
        return null;
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-blue-600 text-white flex flex-col p-4 shadow-lg">
                <div className="text-xl font-bold mb-6 text-center">
                    {user.role === 'super_admin' ? 'Super Admin Panel' : 'Admin Panel'}
                </div>
                <nav className="flex-1">
                    {renderSidebarNav()}
                </nav>
                <div className="mt-auto">
                    <div className="text-sm text-gray-200 mb-2">Logged in as: {user.full_name || user.username} ({user.role})</div>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-white shadow p-4 flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
                    {/* Anda bisa menambahkan elemen header lain di sini */}
                </header>

                {/* Content Area */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;