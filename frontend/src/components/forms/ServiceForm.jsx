// src/components/forms/ServiceForm.jsx
import React, { useState, useEffect } from 'react';

const ServiceForm = ({ onSubmit, initialData = {}, isEditMode = false, loading = false, error = '' }) => {
    const [formData, setFormData] = useState({
        service_name: '',
        service_prefix: '',
        estimated_duration_minutes: 10, // Default value
        description: '',
        is_active: true, // Default active
    });

    // Mengisi form dengan data awal saat mode edit
    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                service_name: initialData.service_name || '',
                service_prefix: initialData.service_prefix || '',
                // Pastikan nilai initialData.estimated_duration_minutes adalah number, default 10
                estimated_duration_minutes: Number(initialData.estimated_duration_minutes) || 10,
                description: initialData.description || '',
                is_active: initialData.is_active !== undefined ? initialData.is_active : true,
            });
        } else {
            // Reset form jika bukan mode edit
            setFormData({
                service_name: '',
                service_prefix: '',
                estimated_duration_minutes: 10,
                description: '',
                is_active: true,
            });
        }
    }, [isEditMode, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            // Perhatian di sini:
            [name]: type === 'checkbox' ? checked : (name === 'estimated_duration_minutes' ? Number(value) : value),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Pastikan estimated_duration_minutes adalah number sebelum dikirim
        const dataToSend = {
            ...formData,
            estimated_duration_minutes: Number(formData.estimated_duration_minutes),
        };
        // Lakukan validasi minimal di frontend juga jika perlu
        if (dataToSend.estimated_duration_minutes <= 0 || !Number.isInteger(dataToSend.estimated_duration_minutes)) {
            // Ini bisa jadi error frontend, tapi backend akan menangkapnya juga
            alert("Estimated duration must be a positive integer.");
            return;
        }
        onSubmit(dataToSend);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div>
                <label htmlFor="service_name" className="block text-sm font-medium text-gray-700">Service Name:</label>
                <input
                    type="text"
                    id="service_name"
                    name="service_name"
                    value={formData.service_name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                />
            </div>

            <div>
                <label htmlFor="service_prefix" className="block text-sm font-medium text-gray-700">Service Prefix (e.g., A, B):</label>
                <input
                    type="text"
                    id="service_prefix"
                    name="service_prefix"
                    value={formData.service_prefix}
                    onChange={handleChange}
                    maxLength="5"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 5 characters. e.g., 'A', 'REG', 'INFO'.</p>
            </div>

            <div>
                <label htmlFor="estimated_duration_minutes" className="block text-sm font-medium text-gray-700">Estimated Duration (minutes):</label>
                <input
                    type="number"
                    id="estimated_duration_minutes"
                    name="estimated_duration_minutes"
                    value={formData.estimated_duration_minutes}
                    onChange={handleChange}
                    min="1" // HTML5 validation, tapi tetap validasi di JS
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional):</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                ></textarea>
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
                    {loading ? 'Saving...' : (isEditMode ? 'Update Service' : 'Add Service')}
                </button>
            </div>
        </form>
    );
};

export default ServiceForm;