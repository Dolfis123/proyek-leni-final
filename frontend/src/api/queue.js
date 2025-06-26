// src/api/queue.js
import axios from 'axios';
import authApi from './auth';

const API_URL = 'http://localhost:5000/api';

const publicApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getActiveServicesPublic = async () => {
    try {
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
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return { queue: null, message: error.response.data.message || 'No active queue found.' };
        }
        throw error.response?.data || error.message;
    }
};

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

// --- BARIS YANG SANGAT PENTING: Export fungsi getQueueReport ---
export const getQueueReport = async (startDate, endDate, serviceId = null) => {
    try {
        // URL yang BENAR menggunakan template literal
        let url = `/queue/reports?startDate=${startDate}&endDate=${endDate}`; 
        if (serviceId) {
            url += `&serviceId=${serviceId}`;
        }
        const response = await authApi.get(url); // Menggunakan authApi karena ini route Super Admin
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};


export default publicApi;