// src/pages/superadmin/SuperAdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getCurrentUser } from '../../../api/auth';
import axios from '../../../api/auth'; // Menggunakan instance axios yang sudah diatur dengan token
import { Link } from 'react-router-dom';
const SuperAdminDashboard = () => {
    const user = getCurrentUser();
    const [stats, setStats] = useState({ totalUsers: 0, totalServices: 0, todayQueues: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardStats = async () => {
            setLoading(true);
            setError('');
            try {
                // Contoh: Mengambil jumlah user dan layanan
                // Anda perlu membuat endpoint di backend untuk ini jika belum ada
                // atau panggil endpoint yang sudah ada seperti getAllUsers dan getAllServices
                const usersResponse = await axios.get('/users');
                const servicesResponse = await axios.get('/services');
                // Nanti akan ada endpoint untuk statistik antrian hari ini

                setStats({
                    totalUsers: usersResponse.data.length,
                    totalServices: servicesResponse.data.length,
                    todayQueues: 'N/A' // placeholder
                });
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);

    return (
        <DashboardLayout title="Super Admin Dashboard">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome, {user?.full_name || user?.username}!</h2>
            <p className="text-gray-600 mb-6">This is your Super Admin control panel.</p>

            {loading && <p className="text-blue-500">Loading dashboard stats...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Total Users (Admin/SuperAdmin)</h3>
                        <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Total Active Services</h3>
                        <p className="text-4xl font-bold text-green-600">{stats.totalServices}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Queues Today (Placeholder)</h3>
                        <p className="text-4xl font-bold text-purple-600">{stats.todayQueues}</p>
                    </div>
                </div>
            )}

            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link to="/superadmin/users" className="block bg-indigo-500 text-white p-4 rounded-lg shadow-md hover:bg-indigo-600 transition duration-200 text-center font-medium">
                        Manage Users
                    </Link>
                    <Link to="/superadmin/services" className="block bg-teal-500 text-white p-4 rounded-lg shadow-md hover:bg-teal-600 transition duration-200 text-center font-medium">
                        Manage Services
                    </Link>
                    <Link to="/superadmin/settings" className="block bg-orange-500 text-white p-4 rounded-lg shadow-md hover:bg-orange-600 transition duration-200 text-center font-medium">
                        System Settings
                    </Link>
                    <Link to="/superadmin/holidays" className="block bg-rose-500 text-white p-4 rounded-lg shadow-md hover:bg-rose-600 transition duration-200 text-center font-medium">
                        Manage Holidays
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SuperAdminDashboard;