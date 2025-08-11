import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getActiveServicesPublic,
  requestOtp,
  verifyOtpAndCreateQueue,
  getMyQueueStatus,
  requeueMissed,
} from "../../api/queue";

// --- Komponen Ikon untuk UI yang lebih baik ---
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);
const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// --- Komponen Indikator Langkah (Stepper) ---
const StepIndicator = ({ currentStep }) => {
  const steps = ["Pilih Layanan", "Isi Data Diri", "Verifikasi OTP"];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
                currentStep > index + 1
                  ? "bg-green-500 border-green-500 text-white"
                  : currentStep === index + 1
                  ? "bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-200"
                  : "bg-gray-200 border-gray-300 text-gray-500"
              }`}
            >
              {currentStep > index + 1 ? "✓" : index + 1}
            </div>
            <p
              className={`mt-2 text-xs md:text-sm text-center font-semibold transition-colors duration-300 ${
                currentStep >= index + 1 ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              {step}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-auto h-1 mx-2 md:mx-4 transition-colors duration-500 ${
                currentStep > index + 1 ? "bg-green-500" : "bg-gray-300"
              }`}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const QueueRegistrationPage = () => {
  // ... (SEMUA STATE DAN LOGIKA ANDA TETAP SAMA, TIDAK PERLU DIUBAH)
  // State untuk mengelola langkah-langkah pendaftaran
  const [step, setStep] = useState(1);
  // State untuk menyimpan daftar layanan yang tersedia
  const [services, setServices] = useState([]);
  // State untuk menyimpan layanan yang dipilih pengguna dari Step 1
  const [selectedService, setSelectedService] = useState(null);
  // State untuk menyimpan data formulir pendaftaran (nama, email, telepon)
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone_number: "",
    service_id: "",
  });
  // State untuk input kode OTP oleh pengguna di Step 3
  const [otpCode, setOtpCode] = useState("");
  // State untuk mengelola status loading UI
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [otpSentMessage, setOtpSentMessage] = useState("");
  // State untuk timer hitung mundur kirim ulang OTP
  const [resendTimer, setResendTimer] = useState(0);
  // State untuk paginasi di Step 1
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4); // Hanya menampilkan 4 card per halaman
  // Hook dari React Router DOM untuk navigasi programatis
  const navigate = useNavigate();
  // --- Fungsi Validasi Formulir Data Diri (Step 2) ---
  const validateFormData = () => {
    const errors = {};
    if (!formData.customer_name.trim()) {
      errors.customer_name = "Nama lengkap wajib diisi.";
    }
    if (!formData.customer_email.trim()) {
      errors.customer_email = "Email wajib diisi.";
    } else if (!/\S+@\S+\.\S+/.test(formData.customer_email)) {
      errors.customer_email = "Format email tidak valid.";
    }
    if (!formData.customer_phone_number.trim()) {
      errors.customer_phone_number = "Nomor WhatsApp/Telepon wajib diisi.";
    } else if (!/^[0-9+ ]+$/.test(formData.customer_phone_number)) {
      errors.customer_phone_number =
        "Nomor telepon hanya boleh mengandung angka, spasi, atau tanda plus.";
    } else if (formData.customer_phone_number.length < 8) {
      errors.customer_phone_number = "Nomor telepon minimal 8 digit.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }; // --- Fungsi Validasi Kode OTP (Step 3) ---

  const validateOtpCode = () => {
    const errors = {};
    if (!otpCode.trim()) {
      errors.otpCode = "Kode OTP wajib diisi.";
    } else if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      errors.otpCode = "Kode OTP harus 6 digit angka.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }; // --- useEffect: Mengambil Daftar Layanan Aktif dari Backend ---

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const data = await getActiveServicesPublic();
        setServices(data);
      } catch (err) {
        console.error("Gagal mengambil daftar layanan:", err);
        toast.error(
          err.message || "Gagal memuat layanan. Silakan coba lagi nanti."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []); // --- useEffect: Mengelola Timer Hitung Mundur Kirim Ulang OTP ---

  useEffect(() => {
    let timerId;
    if (resendTimer > 0) {
      timerId = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [resendTimer]); // --- Handler: Ketika Pengguna Memilih Layanan dari Daftar ---

  const handleSelectService = (service) => {
    setSelectedService(service);
    setFormData((prev) => ({ ...prev, service_id: service.id }));
    setFieldErrors({});
    setStep(2);
  }; // --- Handler: Mengelola Perubahan pada Input Formulir Data Diri ---

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }; // --- Handler: Ketika Pengguna Meminta Kode Verifikasi (OTP) ---

  const handleRequestOtp = async (e) => {
    e.preventDefault();

    if (!validateFormData()) {
      toast.warn("Mohon lengkapi semua data dengan benar.");
      return;
    }

    setLoading(true);
    setOtpSentMessage("");
    setOtpCode("");

    try {
      let userHasExistingQueue = false;
      let existingQueueData = null;

      const myStatusResponse = await getMyQueueStatus(formData.customer_email);

      if (myStatusResponse && myStatusResponse.queue) {
        userHasExistingQueue = true;
        existingQueueData = myStatusResponse.queue;
      }

      if (userHasExistingQueue) {
        if (existingQueueData.status === "missed") {
          if (existingQueueData.service_id === selectedService.id) {
            if (
              window.confirm(
                `Anda memiliki antrian terlewat (${existingQueueData.full_queue_number}) untuk layanan ${existingQueueData.service_name} hari ini. Apakah Anda ingin mengambil ulang antrian?`
              )
            ) {
              await handleRequeueMissed(
                formData.customer_email,
                selectedService.id
              );
              return;
            }
          } else {
            // missed tapi layanan lain, lanjut daftar baru
          }
        } else {
          const msg =
            "Anda sudah memiliki antrian aktif hari ini untuk layanan ini atau layanan lain. Mohon pantau antrian Anda.";
          toast.info(msg);
          setLoading(false);
          return;
        }
      }

      const response = await requestOtp(formData);
      setOtpSentMessage(response.message); // --- Mengubah timer ke 120 detik (2 menit) ---
      setResendTimer(60);
      setStep(3);
      toast.success(response.message);
    } catch (err) {
      console.error("Gagal meminta OTP:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Gagal mengirim OTP. Silakan coba lagi.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }; // --- Handler: Ketika Pengguna Memverifikasi Kode OTP dan navigasi langsung ---

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateOtpCode()) {
      toast.warn("Kode OTP harus 6 digit angka.");
      setLoading(false);
      return;
    }

    try {
      const dataToSend = { ...formData, otp_code: otpCode };
      const response = await verifyOtpAndCreateQueue(dataToSend); // Tampilkan toast sukses, lalu langsung navigasi

      toast.success(response.message); // LANGSUNG NAVIGASI KE HALAMAN STATUS PRIBADI DENGAN EMAIL SEBAGAI QUERY PARAM

      navigate(`/my-queue-status?email=${formData.customer_email}`);
    } catch (err) {
      console.error("Verifikasi OTP gagal:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Verifikasi OTP gagal. Silakan coba lagi.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }; // --- Handler: "Ambil Ulang Antrian" (Requeue Missed) ---

  const handleRequeueMissed = async (email, serviceId) => {
    setLoading(true);
    try {
      const response = await requeueMissed({
        customer_email: email,
        service_id: serviceId,
      }); // Setelah requeue berhasil, kita tetap navigasi ke halaman MyQueueStatus

      toast.success(response.message || "Antrian berhasil diambil ulang!");
      navigate(`/my-queue-status?email=${email}`);
    } catch (err) {
      console.error("Gagal mengambil ulang antrian:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Gagal mengambil ulang antrian. Silakan coba lagi.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }; // --- Handler: Ketika Pengguna Meminta Kirim Ulang Kode OTP ---

  const handleResendOtp = async () => {
    setLoading(true);
    setOtpSentMessage("");
    try {
      const response = await requestOtp(formData);
      setOtpSentMessage(response.message); // --- Mengubah timer ke 120 detik (2 menit) ---
      setResendTimer(120);
      toast.success(response.message || "Kode OTP berhasil dikirim ulang.");
    } catch (err) {
      console.error("Gagal mengirim ulang OTP:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Gagal mengirim ulang OTP.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  // Tambahkan fungsi ini di dalam komponen QueueRegistrationPage Anda,
  // di dekat fungsi-fungsi handler lainnya.

  const handlePaste = (e) => {
    // 1. Mencegah aksi paste default agar tidak menempelkan semua teks ke satu kotak
    e.preventDefault();

    // 2. Mengambil data teks dari clipboard
    const pastedData = e.clipboardData.getData("text");

    // 3. Membersihkan data: hanya ambil 6 digit angka pertama
    const otpValue = pastedData.replace(/[^0-9]/g, "").slice(0, 6);

    // 4. Jika data yang dipaste valid (berisi angka), update state
    if (otpValue) {
      setOtpCode(otpValue);
    }
  };
  // --- Logika Paginasi untuk Step 1 ---
  const indexOfLastService = currentPage * itemsPerPage;
  const indexOfFirstService = indexOfLastService - itemsPerPage;
  const currentServices = services.slice(
    indexOfFirstService,
    indexOfLastService
  );
  const totalPages = Math.ceil(services.length / itemsPerPage);
  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };
  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const renderStepContent = () => {
    switch (step) {
      // Cari fungsi renderStepContent() di kode Anda...
      // Lalu ganti isi dari 'case 1:' dengan ini:

      case 1:
        return (
          <>
            {/* Bagian Loading (Tetap Sama) */}
            {loading && (
              <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center rounded-xl z-10">
                <svg
                  className="animate-spin h-10 w-10 text-indigo-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="mt-4 text-indigo-600 font-semibold">
                  Memuat Layanan...
                </p>
              </div>
            )}
            {/* Grid Kartu Layanan (Tetap Sama) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {!loading && services.length === 0 && (
                <p className="text-center text-gray-500 col-span-full py-10">
                  Tidak ada layanan aktif saat ini.
                </p>
              )}
              {currentServices.map((service) => (
                <div
                  key={service.id}
                  className="group bg-white rounded-lg border border-gray-200 hover:border-indigo-500 hover:shadow-lg p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  onClick={() => handleSelectService(service)}
                >
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {service.service_name}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {service.description || "Layanan tersedia untuk umum."}
                    </p>
                  </div>
                  <div className="text-right mt-4 text-sm font-semibold text-indigo-500 group-hover:text-indigo-700">
                    Pilih Layanan →
                  </div>
                </div>
              ))}
            </div>

            {/* Paginasi (Tetap Sama) */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 rounded-md font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &larr;
                </button>
                <span className="text-gray-700 font-medium text-sm">
                  Hal {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || loading}
                  className="px-4 py-2 rounded-md font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &rarr;
                </button>
              </div>
            )}

            {/* --- PENAMBAHAN TOMBOL NAVIGASI LOGIN DAN STATUS PUBLIK --- */}
            <div className="mt-10 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500 mb-4">
                Atau, akses halaman lain di bawah ini:
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link
                  to="/status-display"
                  className="w-full sm:w-auto text-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Lihat Papan Antrian Publik
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto text-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Login Staf / Admin
                </Link>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div>
                <label
                  htmlFor="customer_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon />
                  </div>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleFormChange}
                    required
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-md shadow-sm transition ${
                      fieldErrors.customer_name
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                  />
                </div>
                {fieldErrors.customer_name && (
                  <p className="text-red-600 text-xs mt-1">
                    {fieldErrors.customer_name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="customer_email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email (Untuk OTP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MailIcon />
                  </div>
                  <input
                    type="email"
                    id="customer_email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleFormChange}
                    required
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-md shadow-sm transition ${
                      fieldErrors.customer_email
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                  />
                </div>
                {fieldErrors.customer_email && (
                  <p className="text-red-600 text-xs mt-1">
                    {fieldErrors.customer_email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="customer_phone_number"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon />
                  </div>
                  <input
                    type="tel"
                    id="customer_phone_number"
                    name="customer_phone_number"
                    value={formData.customer_phone_number}
                    onChange={handleFormChange}
                    required
                    placeholder="08123456789"
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-md shadow-sm transition ${
                      fieldErrors.customer_phone_number
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                  />
                </div>
                {fieldErrors.customer_phone_number && (
                  <p className="text-red-600 text-xs mt-1">
                    {fieldErrors.customer_phone_number}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setFieldErrors({});
                  }}
                  className="px-6 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-300"
                >
                  &larr; Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-300"
                >
                  {loading && <Spinner />}
                  {loading ? "Mengirim..." : "Dapatkan OTP"}
                </button>
              </div>
            </form>
          </>
        );
      // Ganti seluruh bagian `case 3:` di dalam fungsi renderStepContent() dengan kode ini:

      case 3: // Langkah 3: Verifikasi OTP
        return (
          <>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600">
                  {otpSentMessage ||
                    "Kode verifikasi 6 digit telah dikirim ke email:"}
                  <strong className="block text-gray-800 mt-1">
                    {formData.customer_email}
                  </strong>
                </p>
              </div>
              <div>
                <div className="flex justify-center gap-2 md:gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={otpCode[index] || ""}
                      // --- TAMBAHKAN onPaste DI SINI ---
                      onPaste={handlePaste}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        const newOtpCode = [...otpCode];
                        newOtpCode[index] = value;
                        setOtpCode(newOtpCode.join(""));
                        if (value && index < 5) e.target.nextSibling?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          !otpCode[index] &&
                          index > 0
                        ) {
                          e.target.previousSibling?.focus();
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className={`w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold rounded-lg border-2 transition ${
                        fieldErrors.otpCode
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                      required
                    />
                  ))}
                </div>
                {fieldErrors.otpCode && (
                  <p className="text-red-600 text-xs mt-2 text-center">
                    {fieldErrors.otpCode}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep(2);
                    setFieldErrors({});
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-300"
                >
                  &larr; Ubah Data
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors duration-300"
                >
                  {loading && <Spinner />}
                  {loading ? "Memverifikasi..." : "Verifikasi & Ambil Antrian"}
                </button>
              </div>

              <div className="text-center mt-6">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-500">
                    Kirim ulang kode dalam{" "}
                    <span className="font-bold text-indigo-600">
                      {resendTimer}
                    </span>{" "}
                    detik
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-sm text-indigo-600 hover:underline disabled:text-gray-400 font-medium"
                  >
                    Tidak menerima kode? Kirim Ulang
                  </button>
                )}
              </div>
            </form>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-3xl">
        {/* --- BAGIAN HEADER DAN PENJELASAN --- */}
        <header className="mb-8 text-center">
          {/* Ganti dengan logo Anda jika ada */}
          {/* <img src="/logo-pn.png" alt="Logo Pengadilan Negeri Manokwari" className="h-20 mx-auto mb-4" /> */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">
            Pendaftaran Antrian Online
          </h1>
          <p className="mt-2 text-gray-600 max-w-xl mx-auto">
            Selamat datang di sistem pendaftaran antrian online Pengadilan
            Negeri Manokwari. Silakan ikuti tiga langkah mudah di bawah ini
            untuk mendapatkan nomor antrian Anda.
          </p>
        </header>

        {/* --- KARTU UTAMA --- */}
        <main className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-gray-100 relative">
          <StepIndicator currentStep={step} />
          <div className="mt-8">{renderStepContent()}</div>
        </main>

        {/* --- TOMBOL NAVIGASI BAWAH --- */}
        <footer className="text-center mt-8">
          <Link
            to="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            &larr; Kembali ke Halaman Utama
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default QueueRegistrationPage;
