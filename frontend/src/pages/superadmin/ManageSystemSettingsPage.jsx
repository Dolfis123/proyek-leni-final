// src/pages/superadmin/ManageSystemSettingsPage.jsx
import React, { useEffect, useState, useRef } from 'react'; // <<< TAMBAHKAN useRef
import DashboardLayout from '../../components/common/DashboardLayout';
import { getAllSettings, setSetting } from '../../api/system';
import toast from 'react-hot-toast'; // <<< PASTIKAN INI DIIMPORT

const ManageSystemSettingsPage = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(''); // <<< DIHAPUS
    const [isSaving, setIsSaving] = useState(false);
    // const [saveError, setSaveError] = useState(''); // <<< DIHAPUS
    // const [saveSuccess, setSaveSuccess] = useState(false); // <<< DIHAPUS, diganti toast.success

    const effectRan = useRef(false); // <<< BARU: useRef untuk melacak eksekusi useEffect

    const fetchSettings = async () => {
        setLoading(true);
        // setError(''); // <<< DIHAPUS
        try {
            const data = await getAllSettings();
            // Mengubah array objek menjadi objek dengan key-value untuk form
            const formattedSettings = {};
            data.forEach(setting => {
                // Konversi nilai boolean string "true"/"false" ke boolean asli
                if (setting.setting_key.includes('active') || setting.setting_key.includes('is_')) {
                    formattedSettings[setting.setting_key] = setting.setting_value === 'true' || setting.setting_value === true;
                } else {
                    formattedSettings[setting.setting_key] = setting.setting_value;
                }
            });
            setSettings(formattedSettings);
            return true; // Mengembalikan true jika fetch berhasil
        } catch (err) {
            console.error('Gagal mengambil pengaturan:', err);
            // setError(err.message || 'Gagal memuat pengaturan sistem.'); // <<< DIHAPUS
            const msg = err.response?.data?.message || 'Gagal memuat pengaturan sistem.';
            toast.error(msg); // <<< BARU: Toast error
            return false; // Mengembalikan false jika fetch gagal
        } finally {
            setLoading(false);
        }
    };

    // useEffect untuk memicu pengambilan data saat komponen dimuat
    useEffect(() => {
        // DEBUGGING: Log setiap kali useEffect dieksekusi
        console.log('[ManageSystemSettingsPage] useEffect (loadSettings) triggered');

        const loadSettings = async () => {
            const success = await fetchSettings(); // Panggil fetchSettings
            if (success) {
                console.log('[ManageSystemSettingsPage] loadSettings successful, attempting to show toast'); // DEBUGGING
                toast.success('Pengaturan sistem berhasil dimuat!'); // <<< BARU: Panggil toast di sini hanya jika sukses
            }
        };

        // Menggunakan effectRan.current untuk memastikan loadSettings hanya dijalankan sekali per mount
        if (effectRan.current === false) { 
            loadSettings();
            effectRan.current = true; 
        }
        
        // Cleanup function
        return () => {
            console.log('[ManageSystemSettingsPage] useEffect cleanup triggered'); // DEBUGGING
        };
    }, []); 

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        // setSaveError(''); // <<< DIHAPUS
        // setSaveSuccess(false); // <<< DIHAPUS

        try {
            // Iterasi semua setting dan kirim ke backend
            for (const key in settings) {
                if (Object.hasOwnProperty.call(settings, key)) {
                    const value = settings[key];
                    // Anda bisa menambahkan deskripsi default atau mengambil dari tempat lain
                    await setSetting(key, String(value), `System setting for ${key}`); // Pastikan nilai dikirim sebagai string
                }
            }
            // setSaveSuccess(true); // <<< DIHAPUS
            // setTimeout(() => setSaveSuccess(false), 3000); 
            toast.success('Pengaturan sistem berhasil disimpan!'); // <<< BARU: Toast sukses
            console.log('Settings saved successfully!');
        } catch (err) {
            console.error('Gagal menyimpan pengaturan:', err);
            // setSaveError(err.message || 'Gagal menyimpan pengaturan.'); // <<< DIHAPUS
            const msg = err.response?.data?.message || 'Gagal menyimpan pengaturan.';
            toast.error(msg); // <<< BARU: Toast error
        } finally {
            setIsSaving(false);
        }
    };

    // Ini adalah daftar kunci pengaturan yang ingin ditampilkan di UI
    const settingDefinitions = [
        { key: 'monday_open_time', label: 'Jam Buka Senin', type: 'time', description: 'Format: HH:MM' },
        { key: 'monday_close_time', label: 'Jam Tutup Senin', type: 'time', description: 'Format: HH:MM' },
        { key: 'monday_break_start_time', label: 'Mulai Istirahat Senin', type: 'time', description: 'Format: HH:MM' },
        { key: 'monday_break_end_time', label: 'Akhir Istirahat Senin', type: 'time', description: 'Format: HH:MM' },
        { key: 'daily_reset_time', label: 'Waktu Reset Harian', type: 'time', description: 'Waktu reset antrian setiap hari (misal: 00:00 atau 06:00)' },
        { key: 'notification_threshold', label: 'Batas Notifikasi', type: 'number', description: 'Jumlah antrian sebelum pelanggan mendapat notifikasi "segera dipanggil"' },
        // Anda bisa menambahkan pengaturan lain di sini
        // { key: 'global_is_active', label: 'Sistem Aktif', type: 'checkbox', description: 'Status aktif/non-aktif keseluruhan sistem' },
    ];

    // DEBUGGING: Log setiap kali komponen dirender
    console.log('[ManageSystemSettingsPage] Component Render');

    return (
        <DashboardLayout title="System Settings">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Kelola Pengaturan Sistem Global</h2>

                {loading && <p className="text-blue-500 text-center">Memuat pengaturan...</p>}
                {/* Error global dari fetchSettings tidak lagi ditampilkan di sini, melainkan di toast */}
                {/* {error && <p className="text-red-500 text-center">{error}</p>} */}

                {!loading && (
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        {/* Error atau sukses pesan yang lebih spesifik formulir, jika diperlukan. Diganti dengan toast. */}
                        {/* {saveError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">{saveError}</span>
                            </div>
                        )}
                        {saveSuccess && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">Settings saved successfully!</span>
                            </div>
                        )} */}

                        {settingDefinitions.map(setting => (
                            <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                <label htmlFor={setting.key} className="block text-sm font-medium text-gray-700 md:col-span-1">
                                    {setting.label}:
                                </label>
                                <div className="md:col-span-2">
                                    {setting.type === 'checkbox' ? (
                                        <input
                                            type="checkbox"
                                            id={setting.key}
                                            name={setting.key}
                                            checked={settings[setting.key] === 'true' || settings[setting.key] === true} // Handle string "true" from DB
                                            onChange={(e) => setSettings(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                    ) : (
                                        <input
                                            type={setting.type}
                                            id={setting.key}
                                            name={setting.key}
                                            value={settings[setting.key] || ''}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            required
                                        />
                                    )}
                                    {setting.description && (
                                        <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
                            <button
                                type="submit"
                                className={`px-6 py-2 rounded-md font-semibold text-white ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ManageSystemSettingsPage;