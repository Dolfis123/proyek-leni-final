// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Import komponen routing dari react-router-dom

import Test from './pages/public/Test';


function App() {
    return (
        // Menggunakan komponen Routes dari react-router-dom untuk mendefinisikan semua rute aplikasi
        <Routes>
                      <Route path="/" element={<Test />} /> {/* Halaman Status Antrian Pribadi (untuk pengguna cek status) */}
            <Route path="*" element={<h1 className="text-center text-3xl font-bold mt-20">404 - Halaman Tidak Ditemukan</h1>} />
        </Routes>
    );
}

export default App;