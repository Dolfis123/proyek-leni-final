// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Pastikan port tetap 5174
    host: true, // <<< BARU: Izinkan host eksternal
    // <<< BARU: Izinkan host spesifik ini >>>
    allowedHosts: [
      'https://skydance.life',
      'https://www.skydance.life'
    ]
  }
});