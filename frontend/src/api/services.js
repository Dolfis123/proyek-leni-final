// src/api/services.js
import axios from 'axios';
// Import authApi dari file auth.js lokal Anda.
// Ini adalah import modul JavaScript, BUKAN permintaan HTTP ke server.
import authApi from './auth'; 

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// --- DEBUG LOG: Verifikasi API_URL yang digunakan di services.js ---
console.log(`[DEBUG - services.js] API_URL yang digunakan: ${API_URL}`);
// Pastikan ini adalah 'https://skydance.life/api'

const publicApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Fungsi untuk mendapatkan daftar layanan aktif yang dapat diakses publik
export const getActiveServicesPublic = async () => {
    try {
        // Panggilan API yang benar: GET ke /services/active (dibawah API_URL)
        const response = await publicApi.get('/services/active');
        console.log('[DEBUG - services.js] getActiveServicesPublic berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] getActiveServicesPublic gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

// Fungsi untuk meminta OTP (One-Time Password)
export const requestOtp = async (data) => {
    try {
        // Panggilan API yang benar: POST ke /queue/request-otp (dibawah API_URL)
        const response = await publicApi.post('/queue/request-otp', data);
        console.log('[DEBUG - services.js] requestOtp berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] requestOtp gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

// Fungsi untuk memverifikasi OTP dan membuat antrian baru
export const verifyOtpAndCreateQueue = async (data) => {
    try {
        // Panggilan API yang benar: POST ke /queue/verify-otp-and-create (dibawah API_URL)
        const response = await publicApi.post('/queue/verify-otp-and-create', data);
        console.log('[DEBUG - services.js] verifyOtpAndCreateQueue berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] verifyOtpAndCreateQueue gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

// Fungsi untuk mendapatkan status antrian pribadi berdasarkan email
export const getMyQueueStatus = async (email) => {
    try {
        // Panggilan API yang benar: GET ke /queue/status/my-queue?email=... (dibawah API_URL)
        const response = await publicApi.get(`/queue/status/my-queue?email=${email}`);
        console.log('[DEBUG - services.js] getMyQueueStatus berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] getMyQueueStatus gagal:', error.response?.data || error.message);
        if (error.response && error.response.status === 404) {
            return { queue: null, message: error.response.data.message || 'No active queue found.' };
        }
        throw error.response?.data || error.message;
    }
};

// Fungsi untuk memasukkan kembali antrian yang terlewat
export const requeueMissed = async (data) => {
    try {
        // Panggilan API yang benar: POST ke /queue/requeue-missed (dibawah API_URL)
        const response = await publicApi.post('/queue/requeue-missed', data);
        console.log('[DEBUG - services.js] requeueMissed berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] requeueMissed gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

// --- Admin/Super Admin Queue API (menggunakan authApi karena perlu token) ---

// Fungsi untuk mendapatkan daftar antrian untuk admin berdasarkan serviceId
export const getQueuesForAdmin = async (serviceId) => {
    try {
        // Panggilan API yang benar: GET ke /queue/admin/:serviceId (dibawah API_URL, menggunakan authApi)
        const response = await authApi.get(`/queue/admin/${serviceId}`);
        console.log('[DEBUG - services.js] getQueuesForAdmin berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] getQueuesForAdmin gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

// Fungsi untuk memanggil antrian berikutnya
export const callNextQueue = async (serviceId) => {
    try {
        // Panggilan API yang benar: POST ke /queue/admin/:serviceId/call-next (dibawah API_URL, menggunakan authApi)
        const response = await authApi.post(`/queue/admin/${serviceId}/call-next`);
        console.log('[DEBUG - services.js] callNextQueue berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] callNextQueue gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

// Fungsi untuk mengubah status antrian
export const markQueueStatus = async (queueId, status) => {
    try {
        // Panggilan API yang benar: PUT ke /queue/admin/:queueId/mark-status (dibawah API_URL, menggunakan authApi)
        const response = await authApi.put(`/queue/admin/${queueId}/mark-status`, { status });
        console.log('[DEBUG - services.js] markQueueStatus berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] markQueueStatus gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

// Fungsi untuk memanggil ulang antrian terakhir yang terlewat
export const recallLastCalledQueue = async (serviceId) => {
    try {
        // Panggilan API yang benar: POST ke /queue/admin/:serviceId/recall-last (dibawah API_URL, menggunakan authApi)
        const response = await authApi.post(`/queue/admin/${serviceId}/recall-last`);
        console.log('[DEBUG - services.js] recallLastCalledQueue berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] recallLastCalledQueue gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

// Untuk public queue display (Socket.IO akan handle updates, tapi ini untuk initial fetch)
export const getPublicQueueStatusAPI = async () => {
    try {
        // Panggilan API yang benar: GET ke /queue/status/public (dibawah API_URL)
        const response = await publicApi.get('/queue/status/public');
        console.log('[DEBUG - services.js] getPublicQueueStatusAPI berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] getPublicQueueStatusAPI gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

// Fungsi untuk mendapatkan laporan antrian
export const getQueueReport = async (startDate, endDate, serviceId = null) => {
    try {
        let url = `/queue/reports?startDate=${startDate}&endDate=${endDate}`; 
        if (serviceId) {
            url += `&serviceId=${serviceId}`;
        }
        // Panggilan API yang benar: GET ke /queue/reports?... (dibawah API_URL, menggunakan authApi)
        const response = await authApi.get(url); 
        console.log('[DEBUG - services.js] getQueueReport berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] getQueueReport gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

export default publicApi; // Export instance axios untuk request lain yang membutuhkan auth
