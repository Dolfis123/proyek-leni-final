// src/components/forms/HolidayForm.jsx
import React, { useState, useEffect } from 'react';

const HolidayForm = ({ onSubmit, initialData = {}, isEditMode = false, loading = false, error = '' }) => {
    const [formData, setFormData] = useState({
        holiday_date: '',
        holiday_name: '',
        is_recurring: false,
    });

    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                holiday_date: initialData.holiday_date || '',
                holiday_name: initialData.holiday_name || '',
                is_recurring: initialData.is_recurring || false,
            });
        } else {
            setFormData({
                holiday_date: '',
                holiday_name: '',
                is_recurring: false,
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
                <label htmlFor="holiday_date" className="block text-sm font-medium text-gray-700">Holiday Date:</label>
                <input
                    type="date" // Menggunakan type="date" untuk kalender picker
                    id="holiday_date"
                    name="holiday_date"
                    value={formData.holiday_date}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                />
            </div>

            <div>
                <label htmlFor="holiday_name" className="block text-sm font-medium text-gray-700">Holiday Name:</label>
                <input
                    type="text"
                    id="holiday_name"
                    name="holiday_name"
                    value={formData.holiday_name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                />
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="is_recurring"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900">Is Recurring (e.g., every year)?</label>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
                <button
                    type="submit"
                    className={`px-4 py-2 rounded-md font-semibold text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : (isEditMode ? 'Update Holiday' : 'Add Holiday')}
                </button>
            </div>
        </form>
    );
};

export default HolidayForm;