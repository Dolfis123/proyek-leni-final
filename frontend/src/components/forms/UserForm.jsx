// src/components/forms/UserForm.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Menggunakan toast untuk notifikasi

// Komponen formulir untuk menambah atau mengedit pengguna
const UserForm = ({ onSubmit, initialData = {}, isEditMode = false, loading = false, error = '' }) => {
    // State untuk menyimpan data formulir
    const [formData, setFormData] = useState({
        username: '',
        password: '', 
        confirmPassword: '', // <<< BARU: State untuk konfirmasi password
        full_name: '',
        email: '',
        role: 'admin', 
        is_active: true, 
    });

    // State untuk menyimpan pesan error validasi per field (inline errors)
    const [fieldErrors, setFieldErrors] = useState({}); 

    // <<< BARU: State untuk mengontrol visibilitas password >>>
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // --- useEffect: Mengisi Form dengan Data Awal Saat Mode Edit ---
    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                username: initialData.username || '',
                password: '', // Password tidak ditampilkan saat edit (diisi jika ingin diubah)
                confirmPassword: '', // <<< BARU: Kosongkan konfirmasi password saat edit
                full_name: initialData.full_name || '',
                email: initialData.email || '',
                role: initialData.role || 'admin',
                is_active: initialData.is_active !== undefined ? initialData.is_active : true,
            });
        } else {
            // Reset form jika bukan mode edit atau initialData kosong
            setFormData({
                username: '',
                password: '',
                confirmPassword: '', // <<< BARU: Reset konfirmasi password
                full_name: '',
                email: '',
                role: 'admin',
                is_active: true,
            });
        }
        setFieldErrors({}); // Membersihkan pesan error validasi saat data awal berubah
    }, [isEditMode, initialData]);

    // --- Fungsi Validasi Formulir ---
    const validateForm = () => {
        const errors = {};
        
        // Validasi Username
        if (!formData.username.trim()) {
            errors.username = 'Username wajib diisi.';
        } else if (formData.username.length < 3) {
            errors.username = 'Username minimal 3 karakter.';
        }

        // Validasi Password (hanya jika tambah mode, atau diisi saat edit)
        const isPasswordProvided = formData.password.trim();
        if (!isEditMode || isPasswordProvided) { // Jika tambah mode ATAU edit mode tapi password diisi
            if (!isPasswordProvided) {
                errors.password = 'Password wajib diisi.';
            } else if (formData.password.length < 6) {
                errors.password = 'Password minimal 6 karakter.';
            }
            // <<< BARU: Validasi Konfirmasi Password >>>
            if (!formData.confirmPassword.trim()) {
                errors.confirmPassword = 'Konfirmasi password wajib diisi.';
            } else if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = 'Password dan konfirmasi password tidak cocok.';
            }
        }

        // Validasi Full Name
        if (!formData.full_name.trim()) {
            errors.full_name = 'Nama lengkap wajib diisi.';
        }

        // Validasi Email
        if (!formData.email.trim()) {
            errors.email = 'Email wajib diisi.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Format email tidak valid.';
        }

        setFieldErrors(errors); // Set error untuk field tertentu
        return Object.keys(errors).length === 0; // Mengembalikan true jika tidak ada error
    };

    // --- Handler: Mengelola Perubahan pada Input Formulir ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Bersihkan error spesifik field saat input berubah
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
        }
        // <<< BARU: Khusus untuk confirmPassword, jika password berubah, bersihkan juga error konfirmasi >>>
        if (name === 'password' && fieldErrors.confirmPassword) {
            setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
        }
    };

    // --- Handler: Submit Formulir ---
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.warn('Mohon lengkapi semua data dengan benar.'); 
            return; 
        }
        // <<< BARU: Hapus confirmPassword dari formData sebelum dikirim ke backend >>>
        const dataToSubmit = { ...formData };
        delete dataToSubmit.confirmPassword;
        onSubmit(dataToSubmit); // Panggil handler submit dari parent component
    };

    // --- Render Komponen ---
    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative transition-all duration-300 ease-in-out">
                    <span className="block sm:inline font-medium">{error}</span>
                </div>
            )}

            {/* Field Username */}
            <div className="relative">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username:</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                transition duration-150 ease-in-out
                                ${fieldErrors.username ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                    required
                    readOnly={isEditMode} 
                />
                {fieldErrors.username && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.username}</p>}
                {isEditMode && <p className="text-xs text-gray-500 mt-1">Username tidak bisa diubah.</p>}
            </div>

            {/* Field Password (tergantung mode: add atau edit) */}
            {!isEditMode && ( 
                <div className="relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
                    <div className="relative"> {/* Tambahkan div relative untuk ikon */}
                        <input
                            type={showPassword ? 'text' : 'password'} 
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                        transition duration-150 ease-in-out pr-10 /* Padding kanan untuk ikon */
                                        ${fieldErrors.password ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                            required={!isEditMode} 
                        />
                        {/* <<< BARU: Tombol/Ikon Show/Hide Password >>> */}
                        <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            {showPassword ? 'Hide' : 'Show'} {/* Anda bisa ganti ini dengan ikon mata */}
                        </button>
                    </div>
                    {fieldErrors.password && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.password}</p>}
                </div>
            )}
            {isEditMode && (
                 <div className="relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password Baru (opsional):</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Biarkan kosong untuk mempertahankan password lama"
                            className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                        transition duration-150 ease-in-out pr-10
                                        ${fieldErrors.password ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                        />
                         <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    {fieldErrors.password && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.password}</p>}
                    <p className="text-xs text-gray-500 mt-1">Isi jika ingin mengubah password.</p>
                </div>
            )}

            {/* <<< BARU: Field Konfirmasi Password (hanya jika tambah mode, atau diisi saat edit) >>> */}
            {!isEditMode && ( // Wajib saat add mode
                <div className="relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password:</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                        transition duration-150 ease-in-out pr-10
                                        ${fieldErrors.confirmPassword ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                            required={!isEditMode} 
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(prev => !prev)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            {showConfirmPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.confirmPassword}</p>}
                </div>
            )}
            {isEditMode && formData.password.trim() && ( // Saat edit, jika password baru diisi, konfirmasi juga harus diisi
                 <div className="relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru:</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                        transition duration-150 ease-in-out pr-10
                                        ${fieldErrors.confirmPassword ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                            required // Wajib jika password baru diisi
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(prev => !prev)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            {showConfirmPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.confirmPassword}</p>}
                </div>
            )}


            {/* Field Full Name */}
            <div className="relative">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap:</label>
                <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                transition duration-150 ease-in-out
                                ${fieldErrors.full_name ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                    required
                />
                {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.full_name}</p>}
            </div>

            {/* Field Email */}
            <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                transition duration-150 ease-in-out
                                ${fieldErrors.email ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                    required
                />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.email}</p>}
            </div>

            {/* Field Role */}
            <div className="relative">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Peran:</label>
                <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                transition duration-150 ease-in-out
                                ${fieldErrors.role ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                    required
                    disabled={isEditMode && initialData.role === 'super_admin'} 
                >
                    <option value="admin">Admin</option>
                    {isEditMode && initialData.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                </select>
                {isEditMode && initialData.role === 'super_admin' && (
                    <p className="text-xs text-red-500 mt-1">Peran Super Admin tidak dapat diubah melalui form ini.</p>
                )}
            </div>

            {/* Field Is Active (hanya tampil saat edit) */}
            {isEditMode && ( 
                <div className="flex items-center mt-4">
                    <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded focus:ring-2 transition duration-150 ease-in-out"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Aktif</label>
                </div>
            )}

            {/* Tombol Submit Form */}
            <div className="flex justify-end pt-6 border-t border-gray-200 mt-8"> 
                <button
                    type="submit"
                    className={`px-6 py-2 rounded-lg font-semibold text-white shadow-md transition duration-200 ease-in-out
                                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105'}`}
                    disabled={loading}
                >
                    {loading ? 'Menyimpan...' : (isEditMode ? 'Perbarui Pengguna' : 'Tambah Pengguna')}
                </button>
            </div>
        </form>
    );
};

export default UserForm;