// src/api/queue.js
import axios from 'axios';
import authApi from './auth'; // Menggunakan instance axios yang sudah dikonfigurasi untuk auth (jika ada request yg perlu auth)

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Instance axios khusus untuk public routes (tanpa token)
const publicApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getActiveServicesPublic = async () => {
    try {
        // Ini endpoint yang tidak butuh autentikasi
        const response = await publicApi.get('/services/active');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const requestOtp = async (data) => {
    try {
        const response = await publicApi.post('/queue/request-otp', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const verifyOtpAndCreateQueue = async (data) => {
    try {
        const response = await publicApi.post('/queue/verify-otp-and-create', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
export const getMyQueueStatus = async (email) => {
    try {
        const response = await publicApi.get(`/queue/status/my-queue?email=${email}`);
        return response.data; // Ini akan mengembalikan { message, queue, current_calling_number, ... }
    } catch (error) {
        // PERBAIKAN: Tangani 404 sebagai kondisi 'tidak ada antrian', bukan error fatal
        if (error.response && error.response.status === 404) {
            // Jika 404, kembalikan objek yang menandakan tidak ada antrian aktif
            return { queue: null, message: error.response.data.message || 'No active queue found.' };
        }
        // Untuk error lain (e.g., 500 Internal Server Error, network error), tetap throw
        throw error.response?.data || error.message;
    }
};
// export const getMyQueueStatus = async (email) => {
//     try {
//         const response = await publicApi.get(`/queue/status/my-queue?email=${email}`);
//         return response.data;
//     } catch (error) {
//         throw error.response?.data || error.message;
//     }
// };

export const requeueMissed = async (data) => {
    try {
        const response = await publicApi.post('/queue/requeue-missed', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// --- Admin/Super Admin Queue API (menggunakan authApi karena perlu token) ---
export const getQueuesForAdmin = async (serviceId) => {
    try {
        const response = await authApi.get(`/queue/admin/${serviceId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const callNextQueue = async (serviceId) => {
    try {
        const response = await authApi.post(`/queue/admin/${serviceId}/call-next`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const markQueueStatus = async (queueId, status) => {
    try {
        const response = await authApi.put(`/queue/admin/${queueId}/mark-status`, { status });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const recallLastCalledQueue = async (serviceId) => {
    try {
        const response = await authApi.post(`/queue/admin/${serviceId}/recall-last`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Untuk public queue display (Socket.IO akan handle updates, tapi ini untuk initial fetch)
export const getPublicQueueStatusAPI = async () => {
    try {
        const response = await publicApi.get('/queue/status/public');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export default publicApi; // Ekspor instance public api