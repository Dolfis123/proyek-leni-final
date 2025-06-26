// src/api/services.js
import axios from 'axios';
import authApi from './auth'; 

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

console.log(`[DEBUG - services.js] API_URL yang digunakan: ${API_URL}`);

const publicApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getActiveServicesPublic = async () => {
    try {
        const response = await publicApi.get('/services/active');
        console.log('[DEBUG - services.js] getActiveServicesPublic berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] getActiveServicesPublic gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

export const requestOtp = async (data) => {
    try {
        const response = await publicApi.post('/queue/request-otp', data);
        console.log('[DEBUG - services.js] requestOtp berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] requestOtp gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

export const verifyOtpAndCreateQueue = async (data) => {
    try {
        const response = await publicApi.post('/queue/verify-otp-and-create', data);
        console.log('[DEBUG - services.js] verifyOtpAndCreateQueue berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] verifyOtpAndCreateQueue gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

export const getMyQueueStatus = async (email) => {
    try {
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

export const requeueMissed = async (data) => {
    try {
        const response = await publicApi.post('/queue/requeue-missed', data);
        console.log('[DEBUG - services.js] requeueMissed berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] requeueMissed gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

// --- Fungsi getAllServices yang hilang ---
export const getAllServices = async () => {
    try {
        // Karena ini adalah manajemen layanan, kemungkinan memerlukan otentikasi admin/super admin
        // Jadi, kita gunakan authApi yang sudah menambahkan token.
        const response = await authApi.get('/services'); 
        console.log('[DEBUG - services.js] getAllServices berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] getAllServices gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};


// --- Admin/Super Admin Queue API (menggunakan authApi karena perlu token) ---
export const getQueuesForAdmin = async (serviceId) => {
    try {
        const response = await authApi.get(`/queue/admin/${serviceId}`);
        console.log('[DEBUG - services.js] getQueuesForAdmin berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] getQueuesForAdmin gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

export const callNextQueue = async (serviceId) => {
    try {
        const response = await authApi.post(`/queue/admin/${serviceId}/call-next`);
        console.log('[DEBUG - services.js] callNextQueue berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] callNextQueue gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

export const markQueueStatus = async (queueId, status) => {
    try {
        const response = await authApi.put(`/queue/admin/${queueId}/mark-status`, { status });
        console.log('[DEBUG - services.js] markQueueStatus berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] markQueueStatus gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

export const recallLastCalledQueue = async (serviceId) => {
    try {
        const response = await authApi.post(`/queue/admin/${serviceId}/recall-last`);
        console.log('[DEBUG - services.js] recallLastCalledQueue berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] recallLastCalledQueue gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

export const getPublicQueueStatusAPI = async () => {
    try {
        const response = await publicApi.get('/queue/status/public');
        console.log('[DEBUG - services.js] getPublicQueueStatusAPI berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] getPublicQueueStatusAPI gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

export const getQueueReport = async (startDate, endDate, serviceId = null) => {
    try {
        let url = `/queue/reports?startDate=${startDate}&endDate=${endDate}`; 
        if (serviceId) {
            url += `&serviceId=${serviceId}`;
        }
        const response = await authApi.get(url); 
        console.log('[DEBUG - services.js] getQueueReport berhasil:', response.data);
        return response.data;
    } catch (error) {
        console.error('[ERROR - services.js] getQueueReport gagal:', error.response?.data || error.message);
        throw error.response?.data || error.message;
    }
};

export default publicApi; 
