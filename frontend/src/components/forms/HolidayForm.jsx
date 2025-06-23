// src/components/forms/HolidayForm.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Menggunakan toast untuk notifikasi

// Komponen formulir untuk menambah atau mengedit hari libur
const HolidayForm = ({ onSubmit, initialData = {}, isEditMode = false, loading = false, error = '' }) => {
    // State untuk menyimpan data formulir
    const [formData, setFormData] = useState({
        holiday_date: '',
        holiday_name: '',
        is_recurring: false,
    });

    // State untuk menyimpan pesan error validasi per field (inline errors)
    const [fieldErrors, setFieldErrors] = useState({}); // <<< BARU: State untuk error per field

    // --- useEffect: Mengisi Form dengan Data Awal Saat Mode Edit ---
    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                holiday_date: initialData.holiday_date || '',
                holiday_name: initialData.holiday_name || '',
                is_recurring: initialData.is_recurring || false,
            });
        } else {
            // Reset form jika bukan mode edit atau initialData kosong
            setFormData({
                holiday_date: '',
                holiday_name: '',
                is_recurring: false,
            });
        }
        setFieldErrors({}); // <<< BARU: Membersihkan pesan error validasi saat data awal berubah
    }, [isEditMode, initialData]);

    // --- Fungsi Validasi Formulir ---
    const validateForm = () => {
        const errors = {};
        
        // Validasi Holiday Date
        if (!formData.holiday_date.trim()) {
            errors.holiday_date = 'Tanggal hari libur wajib diisi.';
        } else if (isNaN(new Date(formData.holiday_date))) { // Memeriksa format tanggal dasar
            errors.holiday_date = 'Format tanggal tidak valid.';
        }

        // Validasi Holiday Name
        if (!formData.holiday_name.trim()) {
            errors.holiday_name = 'Nama hari libur wajib diisi.';
        } else if (formData.holiday_name.length < 3) {
            errors.holiday_name = 'Nama hari libur minimal 3 karakter.';
        }

        setFieldErrors(errors); // Set error untuk field tertentu
        return Object.keys(errors).length === 0; // Mengembalikan true jika tidak ada error validasi
    };

    // --- Handler: Mengelola Perubahan pada Input Formulir ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // <<< BARU: Bersihkan error spesifik field saat input berubah >>>
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    // --- Handler: Submit Formulir ---
    const handleSubmit = (e) => {
        e.preventDefault();
        // <<< BARU: Lakukan Validasi Frontend Sebelum Submit >>>
        if (!validateForm()) {
            toast.warn('Mohon lengkapi semua data dengan benar.'); // Menampilkan toast warning
            return; // Hentikan submit jika validasi gagal
        }
        onSubmit(formData); // Panggil handler submit dari parent component
    };

    // --- Render Komponen ---
    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-2"> {/* Menambah padding dan spacing */}
            {/* Menampilkan error dari parent component (biasanya dari API) */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative transition-all duration-300 ease-in-out">
                    <span className="block sm:inline font-medium">{error}</span>
                </div>
            )}

            {/* Field Holiday Date */}
            <div className="relative">
                <label htmlFor="holiday_date" className="block text-sm font-medium text-gray-700 mb-1">Tanggal Hari Libur:</label>
                <input
                    type="date" // Menggunakan type="date" untuk kalender picker
                    id="holiday_date"
                    name="holiday_date"
                    value={formData.holiday_date}
                    onChange={handleChange}
                    className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                transition duration-150 ease-in-out
                                ${fieldErrors.holiday_date ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                    required
                />
                {/* Pesan error inline untuk tanggal hari libur */}
                {fieldErrors.holiday_date && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.holiday_date}</p>}
            </div>

            {/* Field Holiday Name */}
            <div className="relative">
                <label htmlFor="holiday_name" className="block text-sm font-medium text-gray-700 mb-1">Nama Hari Libur:</label>
                <input
                    type="text"
                    id="holiday_name"
                    name="holiday_name"
                    value={formData.holiday_name}
                    onChange={handleChange}
                    className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                transition duration-150 ease-in-out
                                ${fieldErrors.holiday_name ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                    required
                />
                {/* Pesan error inline untuk nama hari libur */}
                {fieldErrors.holiday_name && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.holiday_name}</p>}
            </div>

            {/* Field Is Recurring (Checkbox) */}
            <div className="flex items-center mt-4">
                <input
                    type="checkbox"
                    id="is_recurring"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded focus:ring-2 transition duration-150 ease-in-out"
                />
                <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900">Berulang Setiap Tahun?</label>
            </div>

            {/* Tombol Submit Form */}
            <div className="flex justify-end pt-6 border-t border-gray-200 mt-8"> 
                <button
                    type="submit"
                    className={`px-6 py-2 rounded-lg font-semibold text-white shadow-md transition duration-200 ease-in-out
                                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105'}`}
                    disabled={loading}
                >
                    {loading ? 'Menyimpan...' : (isEditMode ? 'Perbarui Hari Libur' : 'Tambah Hari Libur')}
                </button>
            </div>
        </form>
    );
};

export default HolidayForm;