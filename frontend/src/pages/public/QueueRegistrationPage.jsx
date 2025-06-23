// src/pages/public/QueueRegistrationPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Menggunakan Link dan useNavigate untuk navigasi
import { 
    getActiveServicesPublic, 
    requestOtp, 
    verifyOtpAndCreateQueue, 
    getMyQueueStatus, 
    requeueMissed 
} from '../../api/queue'; // Mengimpor fungsi-fungsi API untuk antrian

const QueueRegistrationPage = () => {
    // State untuk mengelola langkah-langkah pendaftaran
    // Step 1: Pilih Layanan
    // Step 2: Isi Data Diri & Minta OTP
    // Step 3: Verifikasi OTP
    // Step 4: Antrian Berhasil Dibuat
    const [step, setStep] = useState(1); 

    // State untuk menyimpan daftar layanan yang tersedia
    const [services, setServices] = useState([]);
    // State untuk menyimpan layanan yang dipilih pengguna
    const [selectedService, setSelectedService] = useState(null);

    // State untuk menyimpan data formulir pendaftaran
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone_number: '',
        service_id: '', // Akan diisi saat layanan dipilih
    });

    // State untuk input kode OTP
    const [otpCode, setOtpCode] = useState('');
    // State untuk menyimpan hasil akhir nomor antrian yang didapat
    const [queueResult, setQueueResult] = useState(null);

    // State untuk mengelola status loading dan error
    const [loading, setLoading] = useState(false); // Untuk keseluruhan proses
    const [error, setError] = useState(''); // Pesan error yang ditampilkan ke user
    const [otpSentMessage, setOtpSentMessage] = useState(''); // Pesan konfirmasi pengiriman OTP
    
    // State untuk timer kirim ulang OTP
    const [resendTimer, setResendTimer] = useState(0); 

    // State untuk email yang dimasukkan di Step 4 untuk cek status (defaultnya email yg didaftarkan)
    const [customerEmailForStatus, setCustomerEmailForStatus] = useState('');

    // Hook dari React Router DOM untuk navigasi programatis
    const navigate = useNavigate();

    // --- useEffect untuk Mengambil Daftar Layanan Aktif ---
    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true); // Mulai loading
            setError(''); // Reset error

            try {
                const data = await getActiveServicesPublic(); // Panggil API untuk mendapatkan layanan aktif
                setServices(data); // Simpan layanan ke state
            } catch (err) {
                console.error('Gagal mengambil daftar layanan:', err);
                // Menampilkan pesan error yang lebih user-friendly
                setError(err.message || 'Gagal memuat layanan. Silakan coba lagi nanti.');
            } finally {
                setLoading(false); // Hentikan loading
            }
        };

        fetchServices(); // Panggil fungsi saat komponen pertama kali dimuat
    }, []); // Dependensi kosong, hanya berjalan sekali saat mount

    // --- useEffect untuk Timer Kirim Ulang OTP ---
    useEffect(() => {
        let timerId;
        if (resendTimer > 0) { // Jika timer berjalan
            timerId = setInterval(() => {
                setResendTimer(prev => prev - 1); // Kurangi timer setiap detik
            }, 1000);
        }
        // Cleanup function: hentikan timer saat komponen unmount atau timer selesai
        return () => clearInterval(timerId);
    }, [resendTimer]); // Berjalan setiap kali resendTimer berubah

    // --- Handler: Ketika Pengguna Memilih Layanan ---
    const handleSelectService = (service) => {
        setSelectedService(service); // Simpan layanan yang dipilih
        setFormData(prev => ({ ...prev, service_id: service.id })); // Perbarui service_id di formData
        setStep(2); // Lanjutkan ke langkah pengisian data
    };

    // --- Handler: Ketika Input Formulir Berubah ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value })); // Perbarui state formData
    };

    // --- Handler: Ketika Pengguna Meminta Kode Verifikasi (OTP) ---
    const handleRequestOtp = async (e) => {
        e.preventDefault(); // Mencegah refresh halaman
        setLoading(true);
        setError('');
        setOtpSentMessage('');
        setOtpCode(''); // Reset input OTP

        try {
            let userHasExistingQueue = false; // Flag apakah user sudah punya antrian (aktif/missed)
            let existingQueueData = null; // Data antrian yang sudah ada (jika ditemukan)

            // Lakukan pengecekan status antrian saat ini untuk email yang dimasukkan
            const myStatusResponse = await getMyQueueStatus(formData.customer_email);
            
            // Jika ada respons dan respons.queue tidak null (berarti ada antrian ditemukan)
            if (myStatusResponse && myStatusResponse.queue) {
                userHasExistingQueue = true;
                existingQueueData = myStatusResponse.queue;
            }

            if (userHasExistingQueue) {
                // Skenario: Pengguna sudah memiliki antrian hari ini
                if (existingQueueData.status === 'missed') {
                    // Jika statusnya 'missed' DAN untuk layanan yang SAMA dengan yang sedang dipilih
                    if (existingQueueData.service_id === selectedService.id) {
                        // Tanyakan apakah ingin mengambil ulang antrian
                        if (window.confirm(`Anda memiliki antrian terlewat (${existingQueueData.full_queue_number}) untuk layanan ${existingQueueData.service_name} hari ini. Apakah Anda ingin mengambil ulang antrian?`)) {
                            await handleRequeueMissed(formData.customer_email, selectedService.id);
                            return; // Proses selesai, langsung ke tampilan antrian baru
                        }
                        // Jika user memilih TIDAK mengambil ulang, maka lanjut ke proses OTP baru (dia bisa daftar lagi)
                    } else {
                        // Statusnya 'missed' TAPI UNTUK LAYANAN LAIN
                        // Lanjutkan untuk minta OTP baru untuk layanan yang sedang dipilih
                        // (Tidak perlu pesan error karena ini antrian lain)
                    }
                } else {
                    // Jika statusnya BUKAN 'missed' (misal: waiting, calling, completed, on_hold)
                    // Maka pengguna tidak boleh daftar antrian baru untuk hari ini.
                    setError('Anda sudah memiliki antrian aktif hari ini untuk layanan ini atau layanan lain. Mohon pantau antrian Anda.');
                    setLoading(false);
                    return; // Hentikan proses
                }
            }
            
            // Skenario: Tidak ada antrian aktif, ATAU antrian 'missed' tapi user memilih tidak requeue, ATAU 'missed' untuk layanan lain.
            // Lanjutkan untuk mengirim permintaan OTP baru.
            const response = await requestOtp(formData); // Panggil API request OTP
            setOtpSentMessage(response.message); // Tampilkan pesan bahwa OTP sudah dikirim
            setResendTimer(60); // Mulai timer kirim ulang OTP
            setStep(3); // Lanjutkan ke langkah verifikasi OTP

        } catch (err) {
            console.error('Gagal meminta OTP:', err);
            // Menampilkan pesan error dari respons API jika ada, atau pesan default
            setError(err.response?.data?.message || err.message || 'Gagal mengirim OTP. Silakan coba lagi.');
        } finally {
            setLoading(false); // Hentikan loading
        }
    };

    // --- Handler: Ketika Pengguna Memverifikasi Kode OTP ---
    const handleVerifyOtp = async (e) => {
        e.preventDefault(); // Mencegah refresh halaman
        setLoading(true);
        setError('');

        try {
            const dataToSend = { ...formData, otp_code: otpCode }; // Gabungkan data form dengan OTP
            const response = await verifyOtpAndCreateQueue(dataToSend); // Panggil API verifikasi & buat antrian
            setQueueResult(response.queue); // Simpan hasil antrian yang didapat
            setCustomerEmailForStatus(formData.customer_email); // Set email untuk pengecekan status di step 4
            setStep(4); // Lanjutkan ke langkah Antrian Berhasil Dibuat
        } catch (err) {
            console.error('Verifikasi OTP gagal:', err);
            setError(err.response?.data?.message || err.message || 'Verifikasi OTP gagal. Silakan coba lagi.');
        } finally {
            setLoading(false); // Hentikan loading
        }
    };

    // --- Handler: Ketika Pengguna Meminta "Ambil Ulang Antrian" ---
    const handleRequeueMissed = async (email, serviceId) => {
        setLoading(true);
        setError('');
        try {
            const response = await requeueMissed({ customer_email: email, service_id: serviceId });
            // Set hasil antrian dengan nomor antrian baru yang didapat dari requeue
            setQueueResult({
                full_queue_number: response.new_queue_number,
                service_name: selectedService.service_name // Ambil nama layanan dari selectedService
            });
            setCustomerEmailForStatus(email); // Set email untuk pengecekan status di step 4
            setStep(4); // Langsung ke langkah Antrian Berhasil Dibuat
        } catch (err) {
            console.error('Gagal mengambil ulang antrian:', err);
            setError(err.message || 'Gagal mengambil ulang antrian. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    // --- Handler: Ketika Pengguna Meminta Kirim Ulang Kode OTP ---
    const handleResendOtp = async () => {
        setLoading(true);
        setError('');
        setOtpSentMessage(''); // Hapus pesan lama
        try {
            const response = await requestOtp(formData); // Kirim permintaan OTP lagi
            setOtpSentMessage(response.message); // Tampilkan pesan baru
            setResendTimer(60); // Reset timer ke 60 detik
        } catch (err) {
            console.error('Gagal mengirim ulang OTP:', err);
            setError(err.message || 'Gagal mengirim ulang OTP.');
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi untuk Merender Konten Berdasarkan Langkah (Step) ---
    const renderStepContent = () => {
        switch (step) {
            case 1: // Langkah 1: Pilih Layanan
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
            case 2: // Langkah 2: Isi Data Diri & Minta OTP
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
            case 4: // Langkah 4: Antrian Berhasil Dibuat
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
                                // Navigasi ke halaman status antrian pribadi dengan meneruskan email sebagai query param
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