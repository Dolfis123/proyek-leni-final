import { defineConfig } from 'vite'
// import plugin-plugin lain jika ada, contoh: import react from '@vitejs/plugin-react'

export default defineConfig({
    // Ini adalah konfigurasi utama Vite
    // ... (konfigurasi plugin lainnya, seperti plugins: [react()] jika Anda menggunakan React)

    server: {
        port: 5175,
        host: '0.0.0.0',
        allowedHosts: [
            'pengadilannegerimanokwari.pro', // Hapus / di akhir
            'www.pengadilannegerimanokwari.pro',
            'localhost:5000/api' // Hapus / di akhir
        ],
    },

    // ... (konfigurasi build atau lainnya)
})