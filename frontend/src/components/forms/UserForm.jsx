// src/components/forms/UserForm.jsx
import React, { useState, useEffect } from 'react';

const UserForm = ({ onSubmit, initialData = {}, isEditMode = false, loading = false, error = '' }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '', // Password hanya diisi saat add atau saat edit jika memang ingin diubah
        full_name: '',
        email: '',
        role: 'admin', // Default role 'admin'
        is_active: true, // Default active
    });

    // Mengisi form dengan data awal saat mode edit
    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                username: initialData.username || '',
                password: '', // Jangan tampilkan password lama
                full_name: initialData.full_name || '',
                email: initialData.email || '',
                role: initialData.role || 'admin',
                is_active: initialData.is_active !== undefined ? initialData.is_active : true,
            });
        } else {
            // Reset form jika bukan mode edit
            setFormData({
                username: '',
                password: '',
                full_name: '',
                email: '',
                role: 'admin',
                is_active: true,
            });
        }
    }, [isEditMode, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username:</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                    readOnly={isEditMode} // Username tidak bisa diubah saat edit
                />
                {isEditMode && <p className="text-xs text-gray-500 mt-1">Username tidak bisa diubah.</p>}
            </div>

            {!isEditMode && ( // Password wajib saat add, opsional saat edit
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        required={!isEditMode} // Wajib hanya saat add
                    />
                </div>
            )}
            {isEditMode && (
                 <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password (optional):</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Leave blank to keep current password"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Isi jika ingin mengubah password.</p>
                </div>
            )}

            <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name:</label>
                <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                />
            </div>

            <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role:</label>
                <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                    disabled={isEditMode && initialData.role === 'super_admin'} // Super Admin role tidak bisa diubah dari form ini
                >
                    <option value="admin">Admin</option>
                    {/* Opsi Super Admin hanya boleh muncul jika sedang edit Super Admin itu sendiri */}
                    {isEditMode && initialData.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                </select>
                {isEditMode && initialData.role === 'super_admin' && (
                    <p className="text-xs text-red-500 mt-1">Role Super Admin tidak dapat diubah melalui form ini.</p>
                )}
            </div>

            {isEditMode && ( // Hanya tampilkan is_active saat edit
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Is Active</label>
                </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
                <button
                    type="submit"
                    className={`px-4 py-2 rounded-md font-semibold text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Add User')}
                </button>
            </div>
        </form>
    );
};

export default UserForm;