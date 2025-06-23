// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; 
import { BrowserRouter } from 'react-router-dom';
// --- PERUBAHAN: Ganti import react-toastify dengan react-hot-toast ---
import { Toaster } from 'react-hot-toast'; // Import Toaster dari react-hot-toast
// Hapus import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      {/* --- PERUBAHAN: Tambahkan komponen Toaster di sini --- */}
      {/* Toaster adalah wadah untuk semua notifikasi toast dari react-hot-toast */}
      <Toaster 
        position="top-right" // Posisi notifikasi (top-right, bottom-left, dll.)
        reverseOrder={false} // Urutan notifikasi (baru di atas atau di bawah)
        toastOptions={{
          // Opsi default untuk semua toast (bisa di-override per toast)
          duration: 2000, // Durasi default 3 detik
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            // Opsi khusus untuk toast sukses
            iconTheme: {
              primary: '#4CAF50', // Warna ikon centang
              secondary: '#fff',
            },
          },
          error: {
            // Opsi khusus untuk toast error
            iconTheme: {
              primary: '#EF4444', // Warna ikon X
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);