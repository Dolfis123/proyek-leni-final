// src/components/forms/ServiceForm.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Menggunakan toast untuk notifikasi

// Komponen formulir untuk menambah atau mengedit layanan
const ServiceForm = ({ onSubmit, initialData = {}, isEditMode = false, loading = false, error = '' }) => {
    // State untuk menyimpan data formulir
    const [formData, setFormData] = useState({
        service_name: '',
        service_prefix: '',
        estimated_duration_minutes: 10, // Default value
        description: '',
        is_active: true, // Default active
    });

    // State untuk menyimpan pesan error validasi per field (inline errors)
    const [fieldErrors, setFieldErrors] = useState({}); // <<< BARU: State untuk error per field

    // --- useEffect: Mengisi Form dengan Data Awal Saat Mode Edit ---
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
            // Reset form jika bukan mode edit atau initialData kosong
            setFormData({
                service_name: '',
                service_prefix: '',
                estimated_duration_minutes: 10,
                description: '',
                is_active: true,
            });
        }
        setFieldErrors({}); // <<< BARU: Membersihkan pesan error validasi saat data awal berubah
    }, [isEditMode, initialData]);

    // --- Fungsi Validasi Formulir ---
    const validateForm = () => {
        const errors = {};
        
        // Validasi Service Name
        if (!formData.service_name.trim()) {
            errors.service_name = 'Nama layanan wajib diisi.';
        } else if (formData.service_name.length < 3) {
            errors.service_name = 'Nama layanan minimal 3 karakter.';
        }

        // Validasi Service Prefix
        if (!formData.service_prefix.trim()) {
            errors.service_prefix = 'Prefix layanan wajib diisi.';
        } else if (formData.service_prefix.length > 5) {
            errors.service_prefix = 'Prefix layanan maksimal 5 karakter.';
        }

        // Validasi Estimated Duration
        if (formData.estimated_duration_minutes === null || formData.estimated_duration_minutes === '' || isNaN(formData.estimated_duration_minutes)) {
            errors.estimated_duration_minutes = 'Durasi estimasi wajib diisi.';
        } else if (!Number.isInteger(Number(formData.estimated_duration_minutes)) || Number(formData.estimated_duration_minutes) <= 0) {
            errors.estimated_duration_minutes = 'Durasi estimasi harus bilangan bulat positif.';
        }

        setFieldErrors(errors); // Set error untuk field tertentu
        return Object.keys(errors).length === 0; // Mengembalikan true jika tidak ada error
    };

    // --- Handler: Mengelola Perubahan pada Input Formulir ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'estimated_duration_minutes' ? Number(value) : value),
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
        // Pastikan estimated_duration_minutes adalah number sebelum dikirim
        const dataToSend = {
            ...formData,
            estimated_duration_minutes: Number(formData.estimated_duration_minutes),
        };
        onSubmit(dataToSend); // Panggil handler submit dari parent component
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

            {/* Field Service Name */}
            <div className="relative">
                <label htmlFor="service_name" className="block text-sm font-medium text-gray-700 mb-1">Nama Layanan:</label>
                <input
                    type="text"
                    id="service_name"
                    name="service_name"
                    value={formData.service_name}
                    onChange={handleChange}
                    // Styling input yang lebih elegan dengan focus ring dan border error
                    className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                transition duration-150 ease-in-out
                                ${fieldErrors.service_name ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                    required
                />
                {/* Pesan error inline untuk nama layanan */}
                {fieldErrors.service_name && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.service_name}</p>}
            </div>

            {/* Field Service Prefix */}
            <div className="relative">
                <label htmlFor="service_prefix" className="block text-sm font-medium text-gray-700 mb-1">Prefix Layanan (contoh: A, B):</label>
                <input
                    type="text"
                    id="service_prefix"
                    name="service_prefix"
                    value={formData.service_prefix}
                    onChange={handleChange}
                    maxLength="5"
                    className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                transition duration-150 ease-in-out
                                ${fieldErrors.service_prefix ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                    required
                />
                {fieldErrors.service_prefix && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.service_prefix}</p>}
                <p className="text-xs text-gray-500 mt-1">Maksimal 5 karakter. Contoh: 'A', 'REG', 'INFO'.</p>
            </div>

            {/* Field Estimated Duration */}
            <div className="relative">
                <label htmlFor="estimated_duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">Estimasi Durasi (menit):</label>
                <input
                    type="number"
                    id="estimated_duration_minutes"
                    name="estimated_duration_minutes"
                    value={formData.estimated_duration_minutes}
                    onChange={handleChange}
                    min="1" 
                    className={`block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                transition duration-150 ease-in-out
                                ${fieldErrors.estimated_duration_minutes ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                    required
                />
                {fieldErrors.estimated_duration_minutes && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.estimated_duration_minutes}</p>}
            </div>

         
            <div className="relative">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (Opsional):</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="block w-full px-4 py-2 border rounded-lg shadow-sm placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                transition duration-150 ease-in-out
                                ${fieldErrors.description ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}">
            </textarea>
                
                {fieldErrors.description && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 left-0">{fieldErrors.description}</p>}
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
                    {loading ? 'Menyimpan...' : (isEditMode ? 'Perbarui Layanan' : 'Tambah Layanan')}
                     </button>
            </div>
        </form>
    );
};

export default ServiceForm;