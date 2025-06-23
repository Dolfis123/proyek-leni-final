// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom'; // Untuk redirect
import { getCurrentUser, getToken } from '../../api/auth'; // Fungsi untuk mendapatkan info user dari local storage
import toast from 'react-hot-toast'; // Untuk notifikasi

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = getToken(); // Mendapatkan token dari local storage
    const user = getCurrentUser(); // Mendapatkan data user dari local storage

    // --- Cek Autentikasi ---
    if (!token || !user) {
        // Jika tidak ada token atau user, berarti belum login
        // Tampilkan pesan dan arahkan ke halaman login
        toast.error('Anda perlu login untuk mengakses halaman ini.');
        return <Navigate to="/login" replace />; // Redirect ke halaman login
    }

    // --- Cek Otorisasi (Peran/Role) ---
    // Jika ada `allowedRoles` yang diberikan, cek apakah peran user sesuai
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Jika peran user tidak termasuk dalam daftar peran yang diizinkan
        toast.error(`Akses ditolak. Anda tidak memiliki izin sebagai ${user.role} untuk mengakses halaman ini.`);
        
        // Arahkan ke dashboard sesuai role yang dimiliki, atau ke halaman utama
        if (user.role === 'super_admin') {
            return <Navigate to="/superadmin/dashboard" replace />;
        } else if (user.role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        // Fallback jika role tidak dikenali atau tidak ada dashboard spesifik
        return <Navigate to="/" replace />; 
    }

    // Jika autentikasi dan otorisasi berhasil, render children (komponen halaman yang dilindungi)
    return children;
};

export default ProtectedRoute;