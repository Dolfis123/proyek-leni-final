// src/api/auth.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'; // Pastikan ini sesuai dengan URL backend Anda

const authApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const login = async (username, password) => {
    try {
        const response = await authApi.post('/auth/login', { username, password });
        // Simpan token di localStorage atau sessionStorage setelah login berhasil
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user)); // Simpan data user juga
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

// Interceptor untuk menambahkan token ke setiap request
authApi.interceptors.request.use(config => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});


export default authApi; // Ekspor instance axios untuk request lain yang membutuhkan auth