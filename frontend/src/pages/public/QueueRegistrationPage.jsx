// src/pages/public/QueueRegistrationPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
    getActiveServicesPublic,
    requestOtp,
    verifyOtpAndCreateQueue,
    getMyQueueStatus,
    requeueMissed
} from '../../api/queue';

const QueueRegistrationPage = () => {
    // State untuk mengelola langkah-langkah pendaftaran
    const [step, setStep] = useState(1);

    // State untuk menyimpan daftar layanan yang tersedia
    const [services, setServices] = useState([]);
    // State untuk menyimpan layanan yang dipilih pengguna dari Step 1
    const [selectedService, setSelectedService] = useState(null);

    // State untuk menyimpan data formulir pendaftaran (nama, email, telepon)
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone_number: '',
        service_id: '',
    });

    // State untuk input kode OTP oleh pengguna di Step 3
    const [otpCode, setOtpCode] = useState('');
    // State untuk menyimpan hasil akhir nomor antrian yang didapat setelah verifikasi berhasil
    const [queueResult, setQueueResult] = useState(null);

    // State untuk mengelola status loading UI
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [otpSentMessage, setOtpSentMessage] = useState('');

    // State untuk timer hitung mundur kirim ulang OTP
    const [resendTimer, setResendTimer] = useState(0);

    // State untuk email yang dimasukkan di Step 4 (untuk tombol "Cek Status Antrian Anda")
    const [customerEmailForStatus, setCustomerEmailForStatus] = useState('');

    // --- State untuk Paginasi BARU ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(4); // Hanya menampilkan 4 card per halaman

    // Hook dari React Router DOM untuk navigasi programatis
    const navigate = useNavigate();

    // --- Fungsi Validasi Formulir Data Diri (Step 2) ---
    const validateFormData = () => {
        const errors = {};
        if (!formData.customer_name.trim()) {
            errors.customer_name = 'Nama lengkap wajib diisi.';
        }
        if (!formData.customer_email.trim()) {
            errors.customer_email = 'Email wajib diisi.';
        } else if (!/\S+@\S+\.\S+/.test(formData.customer_email)) {
            errors.customer_email = 'Format email tidak valid.';
        }
        if (!formData.customer_phone_number.trim()) {
            errors.customer_phone_number = 'Nomor WhatsApp/Telepon wajib diisi.';
        } else if (!/^[0-9+ ]+$/.test(formData.customer_phone_number)) {
            errors.customer_phone_number = 'Nomor telepon hanya boleh mengandung angka, spasi, atau tanda plus.';
        } else if (formData.customer_phone_number.length < 8) {
            errors.customer_phone_number = 'Nomor telepon minimal 8 digit.';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // --- Fungsi Validasi Kode OTP (Step 3) ---
    const validateOtpCode = () => {
        const errors = {};
        if (!otpCode.trim()) {
            errors.otpCode = 'Kode OTP wajib diisi.';
        } else if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
            errors.otpCode = 'Kode OTP harus 6 digit angka.';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // --- useEffect: Mengambil Daftar Layanan Aktif dari Backend ---
    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            try {
                const data = await getActiveServicesPublic();
                setServices(data);
            } catch (err) {
                console.error('Gagal mengambil daftar layanan:', err);
                toast.error(err.message || 'Gagal memuat layanan. Silakan coba lagi nanti.');
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    // --- useEffect: Mengelola Timer Hitung Mundur Kirim Ulang OTP ---
    useEffect(() => {
        let timerId;
        if (resendTimer > 0) {
            timerId = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timerId);
    }, [resendTimer]);

    // --- Handler: Ketika Pengguna Memilih Layanan dari Daftar ---
    const handleSelectService = (service) => {
        setSelectedService(service);
        setFormData(prev => ({ ...prev, service_id: service.id }));
        setFieldErrors({});
        setStep(2);
    };

    // --- Handler: Mengelola Perubahan pada Input Formulir Data Diri ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };


    // --- Handler: Ketika Pengguna Meminta Kode Verifikasi (OTP) ---
    const handleRequestOtp = async (e) => {
        e.preventDefault();

        if (!validateFormData()) {
            toast.warn('Mohon lengkapi semua data dengan benar.');
            return;
        }

        setLoading(true);
        setOtpSentMessage('');
        setOtpCode('');

        try {
            let userHasExistingQueue = false;
            let existingQueueData = null;

            const myStatusResponse = await getMyQueueStatus(formData.customer_email);

            if (myStatusResponse && myStatusResponse.queue) {
                userHasExistingQueue = true;
                existingQueueData = myStatusResponse.queue;
            }

            if (userHasExistingQueue) {
                if (existingQueueData.status === 'missed') {
                    if (existingQueueData.service_id === selectedService.id) {
                        if (window.confirm(`Anda memiliki antrian terlewat (${existingQueueData.full_queue_number}) untuk layanan ${existingQueueData.service_name} hari ini. Apakah Anda ingin mengambil ulang antrian?`)) {
                            await handleRequeueMissed(formData.customer_email, selectedService.id);
                            return;
                        }
                    } else {
                        // missed tapi layanan lain, lanjut daftar baru
                    }
                } else {
                    const msg = 'Anda sudah memiliki antrian aktif hari ini untuk layanan ini atau layanan lain. Mohon pantau antrian Anda.';
                    toast.info(msg);
                    setLoading(false);
                    return;
                }
            }

            const response = await requestOtp(formData);
            setOtpSentMessage(response.message);
            // --- PERUBAHAN DI SINI: Set timer ke 120 detik (2 menit) ---
            setResendTimer(120);
            // --- AKHIR PERUBAHAN ---
            setStep(3);
            toast.success(response.message);

        } catch (err) {
            console.error('Gagal meminta OTP:', err);
            const msg = err.response?.data?.message || err.message || 'Gagal mengirim OTP. Silakan coba lagi.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // --- Handler: Ketika Pengguna Memverifikasi Kode OTP ---
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!validateOtpCode()) {
            toast.warn('Kode OTP harus 6 digit angka.');
            setLoading(false);
            return;
        }

        try {
            const dataToSend = { ...formData, otp_code: otpCode };
            const response = await verifyOtpAndCreateQueue(dataToSend);
            setQueueResult(response.queue);
            setCustomerEmailForStatus(formData.customer_email);
            setStep(4);
            toast.success(response.message);
        } catch (err) {
            console.error('Verifikasi OTP gagal:', err);
            const msg = err.response?.data?.message || err.message || 'Verifikasi OTP gagal. Silakan coba lagi.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // --- Handler: Ketika Pengguna Meminta "Ambil Ulang Antrian" (Requeue Missed) ---
    const handleRequeueMissed = async (email, serviceId) => {
        setLoading(true);
        // setActionLoading(true); // Ini tidak didefinisikan sebelumnya, saya biarkan dalam komentar

        try {
            const response = await requeueMissed({ customer_email: email, service_id: serviceId });

            setQueueResult({
                full_queue_number: response.new_queue_number,
                service_name: selectedService.service_name
            });
            setCustomerEmailForStatus(email);
            setStep(4);
            toast.success(response.message || 'Antrian berhasil diambil ulang!');

        } catch (err) {
            console.error('Gagal mengambil ulang antrian:', err);
            const msg = err.response?.data?.message || err.message || 'Gagal mengambil ulang antrian. Silakan coba lagi.';
            toast.error(msg);
        } finally {
            setLoading(false);
            // setActionLoading(false); // Ini tidak didefinisikan sebelumnya, saya biarkan dalam komentar
        }
    };

    // --- Handler: Ketika Pengguna Meminta Kirim Ulang Kode OTP ---
    const handleResendOtp = async () => {
        setLoading(true);
        setOtpSentMessage('');
        try {
            const response = await requestOtp(formData);
            setOtpSentMessage(response.message);
            // --- PERUBAHAN DI SINI: Set timer ke 120 detik (2 menit) ---
            setResendTimer(120);
            // --- AKHIR PERUBAHAN ---
            toast.success(response.message || 'Kode OTP berhasil dikirim ulang.');
        } catch (err) {
            console.error('Gagal mengirim ulang OTP:', err);
            const msg = err.response?.data?.message || err.message || 'Gagal mengirim ulang OTP.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // --- Logika Paginasi BARU ---
    const indexOfLastService = currentPage * itemsPerPage;
    const indexOfFirstService = indexOfLastService - itemsPerPage;
    const currentServices = services.slice(indexOfFirstService, indexOfLastService);

    const totalPages = Math.ceil(services.length / itemsPerPage);

    const handleNextPage = () => {
        setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
    };

    const handlePrevPage = () => {
        setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
    };
    // --- Akhir Logika Paginasi BARU ---

    // --- Fungsi untuk Merender Konten Berdasarkan Langkah (Step) Saat Ini ---
    const renderStepContent = () => {
        switch (step) {
            case 1: // Langkah 1: Memilih Layanan
                return (
                    <>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Pilih Layanan Antrian</h2>
                        {loading && <p className="text-blue-500 text-center">Memuat layanan...</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!loading && services.length === 0 && (
                                <p className="text-center text-gray-600 col-span-full">Tidak ada layanan aktif saat ini.</p>
                            )}
                            {currentServices.map(service => ( // Menggunakan currentServices untuk paginasi
                                <div
                                    key={service.id}
                                    className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200"
                                    onClick={() => handleSelectService(service)}
                                >
                                    <h3 className="text-xl font-semibold text-indigo-600 mb-2">{service.service_name}</h3>
                                    <p className="text-gray-600 text-sm">{service.description || 'Tidak ada deskripsi.'}</p>
                                    <p className="text-gray-500 text-xs mt-2">Estimasi Durasi: {service.estimated_duration_minutes} menit</p>
                                    <button className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200">
                                        Pilih Layanan
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* --- Kontrol Paginasi BARU --- */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-6 space-x-4">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1 || loading}
                                    className="px-4 py-2 rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    &larr; Sebelumnya
                                </button>
                                <span className="text-gray-700">Halaman {currentPage} dari {totalPages}</span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages || loading}
                                    className="px-4 py-2 rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Berikutnya &rarr;
                                </button>
                            </div>
                        )}
                        {/* --- Akhir Kontrol Paginasi BARU --- */}

                        <div className="text-center mt-8">
                            <Link to="/login" className="text-indigo-600 hover:underline font-medium">
                                Sudah punya akun? Login di sini
                            </Link>
                            <span className="mx-3 text-gray-400">|</span>
                            <Link to="/status-display" className="text-blue-600 hover:underline font-medium">
                                Lihat Status Antrian Publik
                            </Link>
                        </div>
                    </>
                );
case 2: // Langkah 2: Mengisi Data Diri & Meminta OTP
    return (
        <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Daftar Antrian: {selectedService?.service_name}
            </h2>
            <form onSubmit={handleRequestOtp} className="space-y-6">
                <div>
                    <label
                        htmlFor="customer_name"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Nama Lengkap:
                    </label>
                    <input
                        type="text"
                        id="customer_name"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleFormChange}
                        className={`mt-1 p-3 block w-full rounded-md border ${
                            fieldErrors.customer_name
                                ? "border-red-500"
                                : "border-gray-300"
                        } shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                        required
                    />
                    {fieldErrors.customer_name && (
                        <p className="text-red-500 text-xs mt-1">
                            {fieldErrors.customer_name}
                        </p>
                    )}
                </div>
                <div>
                    <label
                        htmlFor="customer_email"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Email (untuk OTP & notifikasi):
                    </label>
                    <input
                        type="email"
                        id="customer_email"
                        name="customer_email"
                        value={formData.customer_email}
                        onChange={handleFormChange}
                        className={`mt-1 p-3 block w-full rounded-md border ${
                            fieldErrors.customer_email
                                ? "border-red-500"
                                : "border-gray-300"
                        } shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                        required
                    />
                    {fieldErrors.customer_email && (
                        <p className="text-red-500 text-xs mt-1">
                            {fieldErrors.customer_email}
                        </p>
                    )}
                </div>
                <div>
                    <label
                        htmlFor="customer_phone_number"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Nomor WhatsApp/Telepon (untuk notifikasi):
                    </label>
                    <input
                        type="tel"
                        id="customer_phone_number"
                        name="customer_phone_number"
                        value={formData.customer_phone_number}
                        onChange={handleFormChange}
                        placeholder="e.g., 081234567890"
                        className={`mt-1 p-3 block w-full rounded-md border ${
                            fieldErrors.customer_phone_number
                                ? "border-red-500"
                                : "border-gray-300"
                        } shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                        required
                    />
                    {fieldErrors.customer_phone_number && (
                        <p className="text-red-500 text-xs mt-1">
                            {fieldErrors.customer_phone_number}
                        </p>
                    )}
                </div>
                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => {
                            setStep(1);
                            setFieldErrors({});
                        }}
                        className="px-5 py-3 rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                    >
                        &larr; Kembali
                    </button>
                    <button
                        type="submit"
                        className={`px-5 py-3 rounded-md font-semibold text-white ${
                            loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                        } transition-colors duration-200`}
                        disabled={loading}
                    >
                        {loading ? "Mengirim OTP..." : "Kirim Kode Verifikasi"}
                    </button>
                </div>
            </form>
        </div>
    );
 case 3: // Langkah 3: Verifikasi OTP
    return (
        <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Verifikasi Kode OTP</h2>
            <p className="text-gray-600 text-center mb-6">
                {otpSentMessage || 'Silakan masukkan kode verifikasi 6 digit yang telah dikirimkan ke email Anda.'}
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                    <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 sr-only">Kode OTP:</label>
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength="1"
                                // --- BARU: Atribut untuk memastikan hanya angka ---
                                inputMode="numeric"
                                pattern="[0-9]*"
                                // --- AKHIR BARU ---
                                value={otpCode[index] || ''}
                                onChange={(e) => {
                                    // --- MODIFIKASI: Filter input non-angka ---
                                    const value = e.target.value.replace(/[^0-9]/g, ''); // Hapus semua karakter non-angka
                                    if (value === '') { // Jika input dikosongkan (backspace)
                                        const newOtpCode = otpCode.split('');
                                        newOtpCode[index] = '';
                                        setOtpCode(newOtpCode.join(''));
                                        if (index > 0) {
                                            e.target.previousSibling?.focus();
                                        }
                                    } else if (value.length === 1) { // Jika ada satu angka dimasukkan
                                        const newOtpCode = otpCode.split('');
                                        newOtpCode[index] = value;
                                        setOtpCode(newOtpCode.join(''));
                                        if (index < 5) {
                                            e.target.nextSibling?.focus();
                                        }
                                    }
                                    // --- AKHIR MODIFIKASI ---

                                    // Clear field error for OTP if user starts typing
                                    if (fieldErrors.otpCode) {
                                        setFieldErrors(prev => ({ ...prev, otpCode: undefined }));
                                    }
                                }}
                                onFocus={(e) => e.target.select()}
                                className={`w-12 h-12 text-center text-2xl font-bold rounded-md border ${
                                    fieldErrors.otpCode ? 'border-red-500' : 'border-gray-300'
                                } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                required
                            />
                        ))}
                    </div>
                    {fieldErrors.otpCode && <p className="text-red-500 text-xs mt-2 text-center">{fieldErrors.otpCode}</p>}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => { setStep(2); setFieldErrors({}); }}
                        className="w-full md:w-auto px-5 py-3 rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                    >
                        &larr; Ubah Data
                    </button>
                    <button
                        type="submit"
                        className={`w-full md:w-auto px-5 py-3 rounded-md font-semibold text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} transition-colors duration-200`}
                        disabled={loading}
                    >
                        {loading ? 'Memverifikasi...' : 'Verifikasi & Dapatkan Antrian'}
                    </button>
                </div>

                <div className="text-center mt-6">
                    {resendTimer > 0 ? (
                        <p className="text-sm text-gray-500">Kirim ulang kode dalam <span className="font-bold text-indigo-600">{resendTimer}</span> detik</p>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-sm text-blue-600 hover:underline disabled:text-gray-400 font-medium"
                            disabled={loading}
                        >
                            Kirim Ulang Kode
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
           case 4: // Langkah 4: Antrian Berhasil Dibuat (Tampilan Nomor Antrian)
    return (
        <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-8 text-center animate-fadeInUp">
                Antrian Anda Berhasil Dibuat! 🎉
            </h2>

            {/* Kotak Nomor Antrian Utama */}
            <div className="bg-gradient-to-r from-emerald-400 to-green-500 p-8 rounded-xl shadow-2xl text-white text-center mb-8 transform hover:scale-105 transition-transform duration-300">
                <p className="text-2xl font-semibold mb-3">Nomor Antrian Anda:</p>
                <p className="text-8xl font-extrabold tracking-tight animate-bounceIn">
                    {queueResult?.full_queue_number}
                </p>
                <p className="text-2xl mt-4">
                    Untuk Layanan: <span className="font-bold">{queueResult?.service_name}</span>
                </p>
                <p className="text-sm text-green-100 mt-6 max-w-sm mx-auto">
                    Anda akan menerima notifikasi melalui email. Mohon pantau status antrian Anda.
                </p>
            </div>

            {/* Bagian Cek Status Antrian Anda */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Cek Status Antrian Anda</h3>
                <p className="text-gray-600 mb-5">
                    Masukkan kembali email yang Anda gunakan untuk mendaftar antrian untuk melihat status antrian Anda secara real-time.
                </p>
                <form className="flex flex-col md:flex-row gap-4" onSubmit={async (e) => {
                    e.preventDefault();
                    navigate(`/my-queue-status?email=${customerEmailForStatus}`);
                }}>
                    <input
                        type="email"
                        value={customerEmailForStatus || formData.customer_email}
                        onChange={(e) => setCustomerEmailForStatus(e.target.value)}
                        placeholder="Masukkan email Anda"
                        className="flex-1 p-3 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition duration-200 text-gray-800"
                        required
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 transform hover:scale-105"
                    >
                        Lihat Status Antrian
                    </button>
                </form>

                <div className="text-center mt-6 pt-4 border-t border-gray-200">
                    <Link to="/register-queue" className="text-indigo-600 hover:underline font-medium">
                        Daftar Antrian Baru
                    </Link>
                    <span className="mx-3 text-gray-400">|</span>
                    <Link to="/status-display" className="text-purple-600 hover:underline font-medium">
                        Lihat Status Antrian Publik
                    </Link>
                </div>
            </div>
        </div>
    );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-in-out">
                {renderStepContent()}
            </div>
        </div>
    );
};

export default QueueRegistrationPage;