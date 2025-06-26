// src/api/services.js
import authApi from './auth'; // Menggunakan instance axios yang sudah dikonfigurasi dengan token

export const getActiveServicesPublic = async () => {
    try {
        const response = await authApi.get('/services/active');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getAllServices = async () => {
    try {
        const response = await authApi.get('/services');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createService = async (serviceData) => {
    try {
        const response = await authApi.post('/services', serviceData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateService = async (id, serviceData) => {
    try {
        const response = await authApi.put(`/services/${id}`, serviceData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteService = async (id) => {
    try {
        const response = await authApi.delete(`/services/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};