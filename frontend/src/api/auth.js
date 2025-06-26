// src/api/auth.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const login = async (username, password) => {
    try {
        const response = await authApi.post('/auth/login', { username, password });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user)); 
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const getToken = () => {
    return localStorage.getItem('token');
};

// Interceptor untuk menambahkan token ke setiap request yang menggunakan authApi
authApi.interceptors.request.use(config => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});


// --- BARIS YANG SANGAT PENTING: Export fungsi getAllUsers ---
export const getAllUsers = async () => {
    try {
        const response = await authApi.get('/users'); // Memanggil endpoint /users
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};


export default authApi; // Export instance axios untuk request lain yang membutuhkan auth