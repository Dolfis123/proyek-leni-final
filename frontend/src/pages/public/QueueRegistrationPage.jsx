// src/pages/public/QueueRegistrationPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Menggunakan Link dan useNavigate untuk navigasi
import { 
    getActiveServicesPublic, // Mengambil daftar layanan aktif
    requestOtp,             // Meminta kode OTP
    verifyOtpAndCreateQueue, // Memverifikasi OTP dan membuat antrian
    getMyQueueStatus,       // Mengecek status antrian pengguna (untuk handle 'missed' atau 'active queue')
    requeueMissed           // Mengambil ulang antrian yang terlewat
} from '../../api/queue'; // Mengimpor fungsi-fungsi API untuk antrian

const QueueRegistrationPage = () => {
    // State untuk mengelola langkah-langkah pendaftaran
    // Step 1: Pilih Layanan
    // Step 2: Isi Data Diri & Minta OTP
    // Step 3: Verifikasi OTP
    // Step 4: Antrian Berhasil Dibuat (Tampilan Nomor Antrian)
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
        service_id: '', // ID layanan yang dipilih, otomatis terisi saat handleSelectService
    });

    // State untuk input kode OTP oleh pengguna di Step 3
    const [otpCode, setOtpCode] = useState('');
    // State untuk menyimpan hasil akhir nomor antrian yang didapat setelah verifikasi berhasil
    const [queueResult, setQueueResult] = useState(null); // Berisi { full_queue_number, service_name, ... }

    // State untuk mengelola status loading dan error UI
    const [loading, setLoading] = useState(false); // Indikator loading untuk seluruh proses form
    const [error, setError] = useState(''); // Pesan error yang ditampilkan ke user
    const [otpSentMessage, setOtpSentMessage] = useState(''); // Pesan konfirmasi setelah OTP dikirim (e.g., "OTP telah dikirim...")
    
    // State untuk timer hitung mundur kirim ulang OTP
    const [resendTimer, setResendTimer] = useState(0); 

    // State untuk email yang dimasukkan di Step 4 (untuk tombol "Cek Status Antrian Anda")
    // Default-nya akan diisi dari formData.customer_email setelah pendaftaran berhasil
    const [customerEmailForStatus, setCustomerEmailForStatus] = useState('');

    // Hook dari React Router DOM untuk navigasi programatis (misal: redirect setelah daftar)
    const navigate = useNavigate();

    // --- useEffect: Mengambil Daftar Layanan Aktif dari Backend ---
    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true); // Mulai indikator loading
            setError('');     // Reset pesan error sebelumnya

            try {
                // Memanggil API untuk mendapatkan daftar layanan yang aktif (public)
                const data = await getActiveServicesPublic(); 
                setServices(data); // Menyimpan daftar layanan ke state
            } catch (err) {
                console.error('Gagal mengambil daftar layanan:', err);
                // Menampilkan pesan error yang lebih informatif dari respons backend, jika ada
                setError(err.message || 'Gagal memuat layanan. Silakan coba lagi nanti.');
            } finally {
                setLoading(false); // Hentikan indikator loading
            }
        };

        fetchServices(); // Panggil fungsi fetch saat komponen pertama kali dimuat
    }, []); // Dependensi kosong, artinya useEffect ini hanya berjalan sekali saat komponen di-mount

    // --- useEffect: Mengelola Timer Hitung Mundur Kirim Ulang OTP ---
    useEffect(() => {
        let timerId;
        if (resendTimer > 0) { // Jika timer masih ada hitungan mundurnya
            timerId = setInterval(() => {
                setResendTimer(prev => prev - 1); // Kurangi nilai timer setiap detik
            }, 1000);
        }
        // Cleanup function: Penting untuk membersihkan interval saat komponen unmount atau timer selesai
        return () => clearInterval(timerId);
    }, [resendTimer]); // Efek ini akan dijalankan ulang setiap kali `resendTimer` berubah

    // --- Handler: Ketika Pengguna Memilih Layanan dari Daftar ---
    const handleSelectService = (service) => {
        setSelectedService(service); // Menyimpan objek layanan yang dipilih ke state
        setFormData(prev => ({ ...prev, service_id: service.id })); // Memperbarui `service_id` di data formulir
        setStep(2); // Mengubah langkah ke Step 2 (Formulir Pengisian Data)
    };

    // --- Handler: Mengelola Perubahan pada Input Formulir Data Diri ---
    const handleFormChange = (e) => {
        const { name, value } = e.target; // Mendapatkan nama input dan nilainya
        setFormData(prev => ({ ...prev, [name]: value })); // Memperbarui state `formData` sesuai input
    };

    // --- Handler: Ketika Pengguna Meminta Kode Verifikasi (OTP) ---
    const handleRequestOtp = async (e) => {
        e.preventDefault(); // Mencegah perilaku default form (refresh halaman)
        setLoading(true); // Mulai indikator loading
        setError('');     // Reset pesan error
        setOtpSentMessage(''); // Reset pesan konfirmasi OTP sebelumnya
        setOtpCode(''); // Memastikan input OTP kosong sebelum pengiriman baru

        try {
            let userHasExistingQueue = false; // Flag: apakah user sudah punya antrian (baik aktif atau 'missed')
            let existingQueueData = null;     // Menyimpan data antrian yang sudah ada (jika ditemukan)

            // Memanggil API untuk mengecek status antrian pengguna berdasarkan email yang dimasukkan
            const myStatusResponse = await getMyQueueStatus(formData.customer_email);
            
            // Jika API menemukan antrian aktif atau terlewat (myStatusResponse.queue tidak null)
            if (myStatusResponse && myStatusResponse.queue) {
                userHasExistingQueue = true;
                existingQueueData = myStatusResponse.queue;
            }

            if (userHasExistingQueue) {
                // --- Skenario: Pengguna sudah memiliki antrian hari ini ---
                if (existingQueueData.status === 'missed') {
                    // Jika status antrian sebelumnya 'missed' DAN untuk layanan yang SAMA dengan yang dipilih sekarang
                    if (existingQueueData.service_id === selectedService.id) {
                        // Tampilkan konfirmasi kepada pengguna apakah ingin mengambil ulang antrian
                        if (window.confirm(`Anda memiliki antrian terlewat (${existingQueueData.full_queue_number}) untuk layanan ${existingQueueData.service_name} hari ini. Apakah Anda ingin mengambil ulang antrian?`)) {
                            await handleRequeueMissed(formData.customer_email, selectedService.id); // Jika setuju, panggil fungsi requeue
                            return; // Hentikan eksekusi selanjutnya karena proses sudah ditangani
                        }
                        // Jika user memilih TIDAK mengambil ulang, maka proses akan dilanjutkan ke pengiriman OTP baru
                        // (Diasumsikan dia ingin mendaftar antrian baru untuk layanan yang sama)
                    } else {
                        // Statusnya 'missed' TAPI UNTUK LAYANAN LAIN
                        // Lanjutkan ke proses pengiriman OTP baru untuk layanan yang sedang dipilih
                        // Tidak perlu pesan error karena ini antrian lain
                    }
                } else {
                    // Jika status antrian BUKAN 'missed' (contoh: 'waiting', 'calling', 'completed', 'on_hold')
                    // Maka pengguna tidak diizinkan mendaftar antrian baru untuk hari ini.
                    setError('Anda sudah memiliki antrian aktif hari ini untuk layanan ini atau layanan lain. Mohon pantau antrian Anda.');
                    setLoading(false); // Hentikan loading
                    return; // Hentikan eksekusi
                }
            }
            
            // --- Skenario: Lanjutkan ke Pengiriman OTP Baru ---
            // Kode ini akan dieksekusi jika:
            // 1. Tidak ada antrian aktif/terlewat sama sekali untuk email ini hari ini.
            // 2. Ada antrian 'missed', tapi user memilih TIDAK untuk mengambil ulang antrian yang SAMA.
            // 3. Ada antrian 'missed', tapi antrian tersebut UNTUK LAYANAN LAIN.
            const response = await requestOtp(formData); // Memanggil API untuk mengirim kode OTP
            setOtpSentMessage(response.message); // Menampilkan pesan konfirmasi OTP sudah dikirim
            setResendTimer(60); // Memulai timer hitung mundur kirim ulang OTP (60 detik)
            setStep(3); // Mengubah langkah ke Step 3 (Verifikasi OTP)

        } catch (err) {
            console.error('Gagal meminta OTP:', err);
            // Menampilkan pesan error dari respons API jika ada, atau pesan default jika error lain
            setError(err.response?.data?.message || err.message || 'Gagal mengirim OTP. Silakan coba lagi.');
        } finally {
            setLoading(false); // Menghentikan indikator loading
        }
    };

    // --- Handler: Ketika Pengguna Memverifikasi Kode OTP ---
    const handleVerifyOtp = async (e) => {
        e.preventDefault(); // Mencegah refresh halaman
        setLoading(true);
        setError(''); // Reset error

        try {
            // Menggabungkan data formulir dengan kode OTP yang dimasukkan
            const dataToSend = { ...formData, otp_code: otpCode };
            // Memanggil API untuk memverifikasi OTP dan membuat entri antrian baru
            const response = await verifyOtpAndCreateQueue(dataToSend);
            setQueueResult(response.queue); // Menyimpan detail antrian yang berhasil dibuat
            setCustomerEmailForStatus(formData.customer_email); // Menyimpan email untuk tombol "Cek Status Antrian Anda" di Step 4
            setStep(4); // Mengubah langkah ke Step 4 (Antrian Berhasil Dibuat)
        } catch (err) {
            console.error('Verifikasi OTP gagal:', err);
            setError(err.response?.data?.message || err.message || 'Verifikasi OTP gagal. Silakan coba lagi.');
        } finally {
            setLoading(false); // Menghentikan loading
        }
    };

    // --- Handler: Ketika Pengguna Meminta "Ambil Ulang Antrian" (Requeue Missed) ---
    const handleRequeueMissed = async (email, serviceId) => {
        // eslint-disable-next-line no-undef
        setActionLoading(true); // Mulai loading untuk aksi requeue
        setError('');
        // eslint-disable-next-line no-undef
        setSuccessMessage('');

        try {
            // Memanggil API untuk mengambil ulang antrian yang terlewat
            const response = await requeueMissed({ customer_email: email, service_id: serviceId });
            
            // Memperbarui `queueResult` dengan informasi antrian baru
            setQueueResult({
                full_queue_number: response.new_queue_number,
                service_name: selectedService.service_name // Mengambil nama layanan dari yang dipilih sebelumnya
            });
            setCustomerEmailForStatus(email); // Memastikan email di state untuk cek status tetap benar
            setStep(4); // Langsung pindah ke Step 4 (Antrian Berhasil Dibuat)
            // eslint-disable-next-line no-undef
            setSuccessMessage(response.message || 'Antrian berhasil diambil ulang!'); // Tampilkan pesan sukses
        } catch (err) {
            console.error('Gagal mengambil ulang antrian:', err);
            setError(err.message || 'Gagal mengambil ulang antrian. Silakan coba lagi.');
        } finally {
            // eslint-disable-next-line no-undef
            setActionLoading(false); // Hentikan loading
        }
    };

    // --- Handler: Ketika Pengguna Meminta Kirim Ulang Kode OTP ---
    const handleResendOtp = async () => {
        setLoading(true);
        setError('');
        setOtpSentMessage(''); // Menghapus pesan konfirmasi OTP sebelumnya
        try {
            const response = await requestOtp(formData); // Mengirim permintaan OTP lagi
            setOtpSentMessage(response.message); // Menampilkan pesan konfirmasi baru
            setResendTimer(60); // Mengatur ulang timer ke 60 detik
        } catch (err) {
            console.error('Gagal mengirim ulang OTP:', err);
            setError(err.message || 'Gagal mengirim ulang OTP.');
        } finally {
            setLoading(false); // Menghentikan loading
        }
    };

    // --- Fungsi untuk Merender Konten Berdasarkan Langkah (Step) Saat Ini ---
    const renderStepContent = () => {
        switch (step) {
            case 1: // Langkah 1: Memilih Layanan
                return (
                    <>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Pilih Layanan Antrian</h2>
                        {loading && <p className="text-blue-500 text-center">Memuat layanan...</p>}
                        {error && <p className="text-red-500 text-center">{error}</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!loading && !error && services.length === 0 && (
                                <p className="text-center text-gray-600 col-span-full">Tidak ada layanan aktif saat ini.</p>
                            )}
                            {services.map(service => (
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
                    </>
                );
            case 2: // Langkah 2: Mengisi Data Diri & Meminta OTP
                return (
                    <>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Daftar Antrian: {selectedService?.service_name}</h2>
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            <div>
                                <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">Nama Lengkap:</label>
                                <input
                                    type="text"
                                    id="customer_name"
                                    name="customer_name"
                                    value={formData.customer_name}
                                    onChange={handleFormChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700">Email (untuk OTP & notifikasi):</label>
                                <input
                                    type="email"
                                    id="customer_email"
                                    name="customer_email"
                                    value={formData.customer_email}
                                    onChange={handleFormChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="customer_phone_number" className="block text-sm font-medium text-gray-700">Nomor WhatsApp/Telepon (untuk notifikasi):</label>
                                <input
                                    type="tel" 
                                    id="customer_phone_number"
                                    name="customer_phone_number"
                                    value={formData.customer_phone_number}
                                    onChange={handleFormChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    placeholder="e.g., 081234567890"
                                    required
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)} // Kembali ke pilihan layanan
                                    className="px-4 py-2 rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300"
                                >
                                    &larr; Kembali
                                </button>
                                <button
                                    type="submit"
                                    className={`px-4 py-2 rounded-md font-semibold text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                    disabled={loading}
                                >
                                    {loading ? 'Mengirim OTP...' : 'Kirim Kode Verifikasi'}
                                </button>
                            </div>
                        </form>
                    </>
                );
            case 3: // Langkah 3: Verifikasi OTP
                return (
                    <>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Verifikasi OTP</h2>
                        <p className="text-gray-600 text-center mb-4">{otpSentMessage || 'Silakan masukkan kode verifikasi yang telah dikirimkan ke email Anda.'}</p>
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div>
                                <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700">Kode OTP:</label>
                                <input
                                    type="text"
                                    id="otpCode"
                                    name="otpCode"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    maxLength="6" // OTP biasanya 6 digit
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-center text-xl tracking-widest focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    required
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)} // Kembali ke pengisian data
                                    className="px-4 py-2 rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300"
                                >
                                    &larr; Ubah Data
                                </button>
                                <button
                                    type="submit"
                                    className={`px-4 py-2 rounded-md font-semibold text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                    disabled={loading}
                                >
                                    {loading ? 'Memverifikasi...' : 'Verifikasi & Dapatkan Antrian'}
                                </button>
                            </div>
                            <div className="text-center mt-4">
                                {resendTimer > 0 ? (
                                    <p className="text-sm text-gray-500">Kirim ulang kode dalam {resendTimer} detik</p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
                                        disabled={loading}
                                    >
                                        Kirim Ulang Kode
                                    </button>
                                )}
                            </div>
                        </form>
                    </>
                );
            case 4: // Langkah 4: Antrian Berhasil Dibuat (Tampilan Nomor Antrian)
                return (
                    <>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Antrian Anda Berhasil Dibuat!</h2>
                        <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-green-700 text-lg mb-2">Selamat, Anda telah mendapatkan nomor antrian:</p>
                            <p className="text-6xl font-extrabold text-green-800 mb-4">{queueResult?.full_queue_number}</p>
                            <p className="text-xl text-gray-700">Untuk Layanan: <span className="font-semibold">{queueResult?.service_name}</span></p>
                            <p className="text-sm text-gray-500 mt-4">Mohon pantau status antrian Anda melalui halaman status antrian publik atau dengan memasukkan email Anda di bawah.</p>
                        </div>
                        
                        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Cek Status Antrian Anda</h3>
                            <p className="text-gray-600 mb-4">Masukkan kembali email yang Anda gunakan untuk mendaftar antrian untuk melihat status antrian Anda secara real-time.</p>
                            <form className="flex flex-col md:flex-row gap-4" onSubmit={async (e) => {
                                e.preventDefault();
                                // Navigasi ke halaman status antrian pribadi dengan meneruskan email sebagai query parameter
                                navigate(`/my-queue-status?email=${customerEmailForStatus}`);
                            }}>
                                <input
                                    type="email"
                                    value={customerEmailForStatus || formData.customer_email} // Default dari form pendaftaran
                                    onChange={(e) => setCustomerEmailForStatus(e.target.value)}
                                    placeholder="Masukkan email Anda"
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-2 px-3"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
                                >
                                    Lihat Status Antrian
                                </button>
                            </form>
                            <div className="text-center mt-6">
                                <Link to="/register-queue" className="text-blue-600 hover:underline">Daftar Antrian Baru</Link>
                                <span className="mx-2 text-gray-400">|</span>
                                <Link to="/status-display" className="text-blue-600 hover:underline">Lihat Status Antrian Publik</Link>
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        // Container utama halaman, mengatur layout dan background
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
            {/* Kartu putih utama yang berisi konten langkah-langkah */}
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-in-out">
                {renderStepContent()} {/* Memanggil fungsi render untuk menampilkan konten langkah saat ini */}
            </div>
        </div>
    );
};

export default QueueRegistrationPage;