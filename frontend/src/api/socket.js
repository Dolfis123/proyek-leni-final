// src/api/socket.js
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const socket = io(SOCKET_SERVER_URL, {
    path: '/socket.io/', // <--- TAMBAHKAN BARIS INI
    transports: ['websocket', 'polling'], // Prioritaskan websocket
    // Anda bisa menambahkan opsi CORS jika diperlukan, tapi biasanya di server yang diatur
    // cors: {
    //     origin: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
    //     credentials: true
    // }
});

socket.on('connect', () => {
    console.log('Connected to Socket.IO server:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
});

socket.on('connect_error', (err) => {
    console.error('Socket.IO connection error:', err.message);
});

export default socket;