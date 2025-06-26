// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Import komponen routing dari react-router-dom

// --- Import Semua Halaman Aplikasi ---
// Halaman Otentikasi
import LoginPage from './pages/auth/LoginPage';

// Halaman Super Admin Dashboard
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import ManageUsersPage from './pages/superadmin/ManageUsersPage';
import ManageServicesPage from './pages/superadmin/ManageServicesPage';
import ManageSystemSettingsPage from './pages/superadmin/ManageSystemSettingsPage';
import ManageHolidaysPage from './pages/superadmin/ManageHolidaysPage';
import QueueReportsPage from './pages/superadmin/QueueReportsPage';

// Halaman Admin Dashboard
import AdminDashboard from './pages/admin/AdminDashboard';
import QueueManagementPage from './pages/admin/QueueManagementPage';

// Halaman Publik (tanpa login)
import QueueRegistrationPage from './pages/public/QueueRegistrationPage';
import QueueStatusDisplayPage from './pages/public/QueueStatusDisplayPage';
import MyQueueStatusPage from './pages/public/MyQueueStatusPage';

// <<< PASTIKAN INI DIIMPORT: Komponen ProtectedRoute untuk melindungi rute >>>
import ProtectedRoute from './components/common/ProtectedRoute'; 


function App() {
    return (
        // Menggunakan komponen Routes dari react-router-dom untuk mendefinisikan semua rute aplikasi
        <Routes>
            {/* --- Rute Publik (Public Routes) --- */}
            {/* Rute ini dapat diakses oleh siapa saja tanpa perlu login */}
            <Route path="/" element={<QueueRegistrationPage />} /> {/* Halaman Pendaftaran Antrian */}
            <Route path="/status-display" element={<QueueStatusDisplayPage />} /> {/* Halaman Tampilan Status Antrian Publik (untuk display) */}
            <Route path="/my-queue-status" element={<MyQueueStatusPage />} /> {/* Halaman Status Antrian Pribadi (untuk pengguna cek status) */}
            <Route path="/login" element={<LoginPage />} /> {/* Halaman Login Admin/Super Admin */}
            
            {/* Rute default: Ketika pengguna mengakses root URL (/), arahkan ke halaman pendaftaran antrian */}
            {/* <Route path="/" element={<Navigate to="/register-queue" replace />} /> */}


            {/* --- Rute Privat untuk Super Admin --- */}
            {/* Rute-rute ini dilindungi oleh ProtectedRoute, hanya dapat diakses oleh Super Admin */}
            <Route
                path="/superadmin/dashboard"
                element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>}
            />
            <Route
                path="/superadmin/users"
                element={<ProtectedRoute allowedRoles={['super_admin']}><ManageUsersPage /></ProtectedRoute>}
            />
            <Route
                path="/superadmin/services"
                element={<ProtectedRoute allowedRoles={['super_admin']}><ManageServicesPage /></ProtectedRoute>}
            />
            <Route
                path="/superadmin/settings"
                element={<ProtectedRoute allowedRoles={['super_admin']}><ManageSystemSettingsPage /></ProtectedRoute>}
            />
            <Route
                path="/superadmin/holidays"
                element={<ProtectedRoute allowedRoles={['super_admin']}><ManageHolidaysPage /></ProtectedRoute>}
            />
            <Route
                path="/superadmin/reports" 
                element={<ProtectedRoute allowedRoles={['super_admin']}><QueueReportsPage /></ProtectedRoute>}
            />

            {/* --- Rute Privat untuk Admin --- */}
            {/* Rute-rute ini dilindungi oleh ProtectedRoute, hanya dapat diakses oleh Admin (dan Super Admin jika role diberikan) */}
            <Route
                path="/admin/dashboard"
                element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
            />
            <Route
                path="/admin/queue-management"
                // Perhatikan: Admin dan Super Admin diizinkan mengakses halaman manajemen antrian
                element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><QueueManagementPage /></ProtectedRoute>}
            />

            {/* --- Rute Catch-all (Halaman Tidak Ditemukan) --- */}
            {/* Rute ini akan ditampilkan jika tidak ada rute lain yang cocok */}
            <Route path="*" element={<h1 className="text-center text-3xl font-bold mt-20">404 - Halaman Tidak Ditemukan</h1>} />
        </Routes>
    );
}

export default App;