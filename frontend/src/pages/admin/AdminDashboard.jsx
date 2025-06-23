// src/pages/admin/AdminDashboard.jsx
import React from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
// import { getCurrentUser } from '../../api/auth';
import {getCurrentUser} from '../../../api/auth'; // Menggunakan instance axios yang sudah diatur dengan token

const AdminDashboard = () => {
    const user = getCurrentUser();

    return (
        <DashboardLayout title="Admin Dashboard">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Hello, {user?.full_name || user?.username}!</h2>
            <p className="text-gray-600 mb-6">Welcome to your Admin panel. Here you can manage daily queue operations.</p>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Role: Queue Management</h3>
                <p className="text-gray-700 mb-4">
                    This section will allow you to call the next queue number, mark queues as completed or missed, 
                    and view the live status of the queue for your designated service.
                </p>
                <p className="text-blue-600 font-medium">
                    (Queue management features are coming soon!)
                </p>
                {/* Placeholder for queue management UI */}
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;