// src/api/queue.js
import axios from 'axios';
import authApi from './auth';

const API_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const publicApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper untuk menangani error secara konsisten
const handleError = (error, defaultMessage = 'Terjadi kesalahan') => {
    console.error(error); // Log error untuk debugging
    const message = error && error.response && error.response.data && error.response.data.message ?
        error.response.data.message :
        defaultMessage;
    throw new Error(message);
};


export const getActiveServicesPublic = async() => {
    try {
        const response = await publicApi.get('/services/active');
        return response.data;
    } catch (error) {
        handleError(error, 'Gagal mengambil layanan yang aktif');
    }
};

export const requestOtp = async(data) => {
    try {
        const response = await publicApi.post('/queue/request-otp', data);
        return response.data;
    } catch (error) {
        handleError(error, 'Gagal meminta OTP');
    }
};

export const verifyOtpAndCreateQueue = async(data) => {
    try {
        const response = await publicApi.post('/queue/verify-otp-and-create', data);
        return response.data;
    } catch (error) {
        handleError(error, 'Gagal memverifikasi OTP dan membuat antrian');
    }
};

export const getMyQueueStatus = async(email) => {
    try {
        const response = await publicApi.get(`/queue/status/my-queue?email=${email}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Kasus khusus jika antrian tidak ditemukan, jangan lemparkan error
            return { queue: null, message: error.response.data.message || 'Antrian aktif tidak ditemukan.' };
        }
        // Untuk error lainnya, gunakan handler standar
        handleError(error, 'Gagal mendapatkan status antrian Anda');
    }
};

export const requeueMissed = async(data) => {
    try {
        const response = await publicApi.post('/queue/requeue-missed', data);
        return response.data;
    } catch (error) {
        handleError(error, 'Gagal untuk mengantri ulang');
    }
};

// --- Admin/Super Admin Queue API (menggunakan authApi karena perlu token) ---
export const getQueuesForAdmin = async(serviceId) => {
    try {
        const response = await authApi.get(`/queue/admin/${serviceId}`);
        return response.data;
    } catch (error) {
        handleError(error, 'Gagal mengambil data antrian untuk admin');
    }
};

export const callNextQueue = async(serviceId) => {
    try {
        const response = await authApi.post(`/queue/admin/${serviceId}/call-next`);
        return response.data;
    } catch (error) {
        handleError(error, 'Gagal memanggil antrian berikutnya');
    }
};

export const markQueueStatus = async(queueId, status) => {
    try {
        const response = await authApi.put(`/queue/admin/${queueId}/mark-status`, { status });
        return response.data;
    } catch (error) {
        handleError(error, 'Gagal memperbarui status antrian');
    }
};

export const recallLastCalledQueue = async(serviceId) => {
    try {
        const response = await authApi.post(`/queue/admin/${serviceId}/recall-last`);
        return response.data;
    } catch (error) {
        handleError(error, 'Gagal memanggil ulang antrian terakhir');
    }
};

// Untuk public queue display
export const getPublicQueueStatusAPI = async() => {
    try {
        const response = await publicApi.get('/queue/status/public');
        return response.data;
    } catch (error) {
        handleError(error, 'Gagal mengambil status antrian publik');
    }
};

export const getQueueReport = async(startDate, endDate, serviceId = null) => {
    try {
        let url = `/queue/reports?startDate=${startDate}&endDate=${endDate}`;
        if (serviceId) {
            url += `&serviceId=${serviceId}`;
        }
        const response = await authApi.get(url);
        return response.data;
    } catch (error) {
        handleError(error, 'Gagal mengambil laporan antrian');
    }
};

export default publicApi;