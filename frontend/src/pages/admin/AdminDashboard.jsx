// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState, useRef } from 'react'; // <<< PASTIKAN useRef DIIMPORT
import DashboardLayout from '../../components/common/DashboardLayout';
import { getCurrentUser } from '../../api/auth'; 
import toast from 'react-hot-toast'; // <<< PASTIKAN INI DIIMPORT

const AdminDashboard = () => {
    const user = getCurrentUser(); // Mengambil informasi user yang sedang login

    const effectRan = useRef(false); // <<< BARU: useRef untuk melacak eksekusi useEffect

    // --- useEffect: Menampilkan Pesan Selamat Datang ---
    useEffect(() => {
        // DEBUGGING: Log setiap kali useEffect dieksekusi
        console.log('[AdminDashboard] useEffect (welcome message) triggered');

        // Pola untuk menjalankan efek hanya sekali pada initial load
        if (effectRan.current === false) { 
            if (user) { // Pastikan user ada sebelum menampilkan pesan selamat datang
                console.log('[AdminDashboard] Attempting to show welcome toast'); // DEBUGGING
                toast.success(`Selamat datang, ${user.full_name || user.username}!`); // <<< BARU: Toast pesan selamat datang
            }
            effectRan.current = true; 
        }
        
        // Cleanup function (tidak relevan untuk kasus ini)
        return () => {
            console.log('[AdminDashboard] useEffect cleanup triggered'); // DEBUGGING
        };
    }, [user]); // Dependensi: user, agar pesan tampil setelah user terload jika ada delay


    return (
        <DashboardLayout title="Admin Dashboard">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Halo, {user?.full_name || user?.username}!</h2>
            <p className="text-gray-600 mb-6">Selamat datang di panel Admin Anda. Di sini Anda dapat mengelola operasi antrian harian.</p>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Peran Anda: Manajemen Antrian</h3>
                <p className="text-gray-700 mb-4">
                    Bagian ini akan memungkinkan Anda untuk memanggil nomor antrian berikutnya, menandai antrian sebagai selesai atau terlewat, 
                    dan melihat status antrian langsung untuk layanan yang Anda tangani.
                </p>
                <p className="text-blue-600 font-medium">
                    (Fitur manajemen antrian ada di menu "Queue Management" di sidebar!)
                </p>
                {/* Placeholder untuk UI manajemen antrian */}
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;