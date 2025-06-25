// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // <<< BARU: Konfigurasi server development >>>
  server: {
    port: 5174 // <<< UBAH PORT DI SINI
  }
});