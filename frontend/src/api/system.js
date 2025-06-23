// src/api/system.js
import authApi from './auth'; // Menggunakan instance axios yang sudah dikonfigurasi dengan token

// --- System Settings API ---
export const getAllSettings = async () => {
    try {
        const response = await authApi.get('/system/settings');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const setSetting = async (key, value, description = '') => {
    try {
        const response = await authApi.post('/system/settings', { key, value, description });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteSetting = async (key) => {
    try {
        const response = await authApi.delete(`/system/settings/${key}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// --- Holidays API ---
export const getAllHolidays = async () => {
    try {
        const response = await authApi.get('/system/holidays');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createHoliday = async (holidayData) => {
    try {
        const response = await authApi.post('/system/holidays', holidayData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateHoliday = async (id, holidayData) => {
    try {
        const response = await authApi.put(`/system/holidays/${id}`, holidayData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteHoliday = async (id) => {
    try {
        const response = await authApi.delete(`/system/holidays/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};