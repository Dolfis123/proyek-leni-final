// src/pages/superadmin/ManageSystemSettingsPage.jsx
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getAllSettings, setSetting } from '../../api/system';

const ManageSystemSettingsPage = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getAllSettings();
            // Mengubah array objek menjadi objek dengan key-value untuk form
            const formattedSettings = {};
            data.forEach(setting => {
                formattedSettings[setting.setting_key] = setting.setting_value;
            });
            setSettings(formattedSettings);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            setError(err.message || 'Failed to load system settings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        try {
            // Iterasi semua setting dan kirim ke backend
            for (const key in settings) {
                if (Object.hasOwnProperty.call(settings, key)) {
                    const value = settings[key];
                    // Anda bisa menambahkan deskripsi default atau mengambil dari tempat lain
                    await setSetting(key, value, `System setting for ${key}`);
                }
            }
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000); // Hilangkan notif setelah 3 detik
            console.log('Settings saved successfully!');
        } catch (err) {
            console.error('Failed to save settings:', err);
            setSaveError(err.message || 'Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    // Ini adalah daftar kunci pengaturan yang ingin ditampilkan di UI
    const settingDefinitions = [
        { key: 'monday_open_time', label: 'Monday Open Time', type: 'time', description: 'Format: HH:MM' },
        { key: 'monday_close_time', label: 'Monday Close Time', type: 'time', description: 'Format: HH:MM' },
        { key: 'monday_break_start_time', label: 'Monday Break Start', type: 'time', description: 'Format: HH:MM' },
        { key: 'monday_break_end_time', label: 'Monday Break End', type: 'time', description: 'Format: HH:MM' },
        { key: 'daily_reset_time', label: 'Daily Reset Time', type: 'time', description: 'Time to reset queues daily (e.g., 00:00 or 06:00)' },
        { key: 'notification_threshold', label: 'Notification Threshold', type: 'number', description: 'Number of queues before customer gets "soon to be called" notification' },
        // Anda bisa menambahkan pengaturan lain di sini
        // { key: 'global_is_active', label: 'System Active', type: 'checkbox', description: 'Overall system active/inactive' },
    ];

    return (
        <DashboardLayout title="System Settings">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Manage Global System Settings</h2>

                {loading && <p className="text-blue-500 text-center">Loading settings...</p>}
                {error && <p className="text-red-500 text-center">{error}</p>}

                {!loading && !error && (
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        {saveError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">{saveError}</span>
                            </div>
                        )}
                        {saveSuccess && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">Settings saved successfully!</span>
                            </div>
                        )}

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
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ManageSystemSettingsPage;