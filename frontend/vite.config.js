import { defineConfig } from 'vite'
// import plugin-plugin lain jika ada, contoh: import react from '@vitejs/plugin-react'

export default defineConfig({
    // Ini adalah konfigurasi utama Vite
    // ... (konfigurasi plugin lainnya, seperti plugins: [react()] jika Anda menggunakan React)

    server: {
        port: 3001,
        host: '0.0.0.0',
        allowedHosts: [
            'pengadilannegerimanokwari.cloud', // Hapus / di akhir
            'www.pengadilannegerimanokwari.cloud',
            'localhost:5000/api' // Hapus / di akhir
        ],
    },

    // ... (konfigurasi build atau lainnya)
})