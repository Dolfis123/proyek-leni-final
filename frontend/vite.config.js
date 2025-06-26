import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Pastikan port sesuai
    // --- TAMBAHKAN BAGIAN INI ---
    host: '0.0.0.0', // Ini penting agar bisa diakses dari luar localhost
    allowedHosts: ['https://pengadilannegerimanokwari.pro', 'www.https://pengadilannegerimanokwari.pro'],
  }
})