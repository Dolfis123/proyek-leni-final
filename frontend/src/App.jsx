// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsersPage from './pages/superadmin/ManageUsersPage';
import ManageServicesPage from './pages/superadmin/ManageServicesPage';
import ManageSystemSettingsPage from './pages/superadmin/ManageSystemSettingsPage';
import ManageHolidaysPage from './pages/superadmin/ManageHolidaysPage';
import QueueRegistrationPage from './pages/public/QueueRegistrationPage';
import QueueStatusDisplayPage from './pages/public/QueueStatusDisplayPage';
import MyQueueStatusPage from './pages/public/MyQueueStatusPage';
import QueueManagementPage from './pages/admin/QueueManagementPage';
import QueueReportsPage from './pages/superadmin/QueueReportsPage'; // <<< PASTIKAN INI ADA
import { getToken, getCurrentUser } from './api/auth';

// PrivateRoute komponen (tetap sama)
const PrivateRoute = ({ children, allowedRoles }) => {
    const token = getToken();
    const user = getCurrentUser();

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'super_admin') return <Navigate to="/superadmin/dashboard" replace />;
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/register-queue" element={<QueueRegistrationPage />} />
            <Route path="/status-display" element={<QueueStatusDisplayPage />} />
            <Route path="/my-queue-status" element={<MyQueueStatusPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/register-queue" replace />} />


            {/* Private Routes untuk Admin/Super Admin */}
            <Route
                path="/superadmin/dashboard"
                element={<PrivateRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></PrivateRoute>}
            />
            <Route
                path="/superadmin/users"
                element={<PrivateRoute allowedRoles={['super_admin']}><ManageUsersPage /></PrivateRoute>}
            />
            <Route
                path="/superadmin/services"
                element={<PrivateRoute allowedRoles={['super_admin']}><ManageServicesPage /></PrivateRoute>}
            />
            <Route
                path="/superadmin/settings"
                element={<PrivateRoute allowedRoles={['super_admin']}><ManageSystemSettingsPage /></PrivateRoute>}
            />
            <Route
                path="/superadmin/holidays"
                element={<PrivateRoute allowedRoles={['super_admin']}><ManageHolidaysPage /></PrivateRoute>}
            />
      

            <Route
                path="/admin/dashboard"
                element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>}
            />
            <Route
                path="/admin/queue-management"
                element={<PrivateRoute allowedRoles={['admin', 'super_admin']}><QueueManagementPage /></PrivateRoute>}
            />
   
            {/* ... (Routes Super Admin lainnya) ... */}
            <Route
                path="/superadmin/reports" // <<< PASTIKAN ROUTE INI ADA
                element={<PrivateRoute allowedRoles={['super_admin']}><QueueReportsPage /></PrivateRoute>}
            />
            {/* Catch-all untuk halaman tidak ditemukan */}
            <Route path="*" element={<h1 className="text-center text-3xl font-bold mt-20">404 - Page Not Found</h1>} />
        </Routes>
    );
}

export default App;