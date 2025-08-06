// src/api/socket.js
import { io } from "socket.io-client";

// UBAH BARIS INI: Gunakan VITE_SOCKET_URL, bukan VITE_API_BASE_URL
const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

console.log(`[Socket.js] Attempting to connect to: ${SOCKET_SERVER_URL}`); // Log untuk debugging

const socket = io(SOCKET_SERVER_URL, {
  // Opsi 'path' tidak diperlukan untuk konfigurasi standar, lebih baik dihapus
  transports: ["websocket", "polling"], // Prioritaskan websocket
});

socket.on("connect", () => {
  console.log("BERHASIL: Terhubung ke server Socket.IO. ID:", socket.id);
});

socket.on("disconnect", () => {
  console.log("TERPUTUS: Koneksi ke server Socket.IO ditutup.");
});

socket.on("connect_error", (err) => {
  console.error("GAGAL KONEK: Error koneksi Socket.IO:", err.message);
});

export default socket;
