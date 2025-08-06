import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { getMyQueueStatus, requeueMissed } from "../../api/queue";
import toast from "react-hot-toast";

// --- Komponen Ikon SVG untuk UI Profesional ---
const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-400"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
);
const Spinner = ({ small }) => (
  <svg
    className={`animate-spin ${small ? "h-5 w-5" : "h-8 w-8"} text-white`}
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
const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-12 w-12 text-green-500"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);
const ExclamationTriangleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-12 w-12 text-yellow-500"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.008a1 1 0 011 1v3.008a1 1 0 01-1 1H9a1 1 0 01-1-1V5z"
      clipRule="evenodd"
    />
  </svg>
);
const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-12 w-12 text-blue-500"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z"
      clipRule="evenodd"
    />
  </svg>
);
const MegaphoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-12 w-12 text-red-500"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M10 3a1 1 0 011 1v1.31a3.984 3.984 0 012.373 1.293l1.293-1.293a1 1 0 111.414 1.414l-1.293 1.293A3.984 3.984 0 0116.31 10H18a1 1 0 110 2h-1.69a3.984 3.984 0 01-1.293 2.373l1.293 1.293a1 1 0 11-1.414 1.414l-1.293-1.293A3.984 3.984 0 0111 14.69V16a1 1 0 11-2 0v-1.31a3.984 3.984 0 01-2.373-1.293l-1.293 1.293a1 1 0 11-1.414-1.414l1.293-1.293A3.984 3.984 0 013.69 12H2a1 1 0 110-2h1.69a3.984 3.984 0 011.293-2.373L3.69 6.336a1 1 0 011.414-1.414l1.293 1.293A3.984 3.984 0 019 5.31V4a1 1 0 011-1z" />
  </svg>
);

// --- Helper untuk mendapatkan info visual berdasarkan status ---
const getStatusInfo = (status) => {
  switch (status) {
    case "calling":
      return {
        text: "DIPANGGIL",
        color: "red",
        icon: <MegaphoneIcon />,
        message: "Giliran Anda! Silakan segera menuju loket pelayanan.",
      };
    case "waiting":
      return {
        text: "MENUNGGU",
        color: "blue",
        icon: <ClockIcon />,
        message:
          "Mohon menunggu giliran Anda. Pantau terus nomor yang sedang dipanggil.",
      };
    case "completed":
      return {
        text: "SELESAI",
        color: "green",
        icon: <CheckCircleIcon />,
        message:
          "Layanan Anda telah selesai. Terima kasih atas kunjungan Anda.",
      };
    case "missed":
      return {
        text: "TERLEWAT",
        color: "yellow",
        icon: <ExclamationTriangleIcon />,
        message:
          "Anda melewatkan panggilan. Silakan ambil ulang antrian jika masih diperlukan.",
      };
    case "expired":
      return {
        text: "KADALUARSA",
        color: "gray",
        icon: <ExclamationTriangleIcon />,
        message:
          "Nomor antrian Anda telah kadaluarsa. Silakan ambil antrian baru untuk esok hari.",
      };
    default:
      return {
        text: "TIDAK DIKETAHUI",
        color: "gray",
        icon: <ExclamationTriangleIcon />,
        message: "Status antrian tidak diketahui.",
      };
  }
};

const MyQueueStatusPage = () => {
  // ... (SEMUA STATE DAN LOGIKA ANDA TETAP SAMA)
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const emailFromUrl = queryParams.get("email");
    if (emailFromUrl) {
      setEmail(emailFromUrl);
      fetchQueueStatus(emailFromUrl);
    }
  }, [location.search]);

  const fetchQueueStatus = async (currentEmail) => {
    if (!currentEmail) return;
    setLoading(true);
    try {
      const data = await getMyQueueStatus(currentEmail);
      setQueueStatus(data);
    } catch (err) {
      console.error("Gagal mengambil status antrian saya:", err);
      setQueueStatus(null);
      toast.error(
        err.response?.data?.message || "Gagal memuat status antrian."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchQueueStatus(email);
  };

  const handleRequeue = async () => {
    if (!queueStatus?.queue?.id || queueStatus.queue.status !== "missed")
      return;
    if (
      !window.confirm(
        "Apakah Anda yakin ingin mengambil ulang antrian ini? Anda akan mendapatkan nomor baru di urutan terakhir."
      )
    )
      return;

    setActionLoading(true);
    try {
      const response = await requeueMissed({
        customer_email: email,
        service_id: queueStatus.queue.service_id,
      });
      await fetchQueueStatus(email);
      toast.success(response.message || "Antrian berhasil diambil ulang!");
    } catch (err) {
      console.error("Gagal mengambil ulang antrian:", err);
      toast.error(
        err.response?.data?.message || "Gagal mengambil ulang antrian."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const statusInfo = queueStatus?.queue?.status
    ? getStatusInfo(queueStatus.queue.status)
    : null;
  const colorVariants = {
    red: "border-red-500 bg-red-50 text-red-800",
    blue: "border-blue-500 bg-blue-50 text-blue-800",
    green: "border-green-500 bg-green-50 text-green-800",
    yellow: "border-yellow-500 bg-yellow-50 text-yellow-800",
    gray: "border-gray-500 bg-gray-50 text-gray-800",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">
            Status Antrian Anda
          </h1>
          <p className="mt-2 text-gray-600">
            Lacak posisi antrian Anda secara real-time di sini.
          </p>
        </header>

        <main className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100">
          {/* Formulir Pencarian */}
          <form onSubmit={handleSubmit} className="mb-8">
            <label
              htmlFor="emailInput"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Masukkan email yang Anda daftarkan:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  id="emailInput"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                disabled={loading || actionLoading}
              >
                {loading ? "Mencari..." : "Lacak Antrian"}
              </button>
            </div>
          </form>

          {/* Hasil Pencarian */}
          {loading ? (
            <div className="text-center py-10">
              <p className="text-indigo-600">Memuat status...</p>
            </div>
          ) : queueStatus && queueStatus.queue ? (
            // --- KARTU TIKET ANTRIAN ---
            <div
              className={`rounded-xl shadow-lg border-l-8 ${
                colorVariants[statusInfo.color]
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-indigo-700">
                      {queueStatus.queue.service?.service_name || "Layanan"}
                    </p>
                    <p className="text-5xl sm:text-7xl font-extrabold text-gray-800 mt-1">
                      {queueStatus.queue.full_queue_number}
                    </p>
                  </div>
                  <div
                    className={`px-4 py-1 rounded-full text-sm font-bold ${
                      colorVariants[statusInfo.color]
                    } border ${colorVariants[statusInfo.color].replace(
                      "bg-",
                      "border-"
                    )}`}
                  >
                    {statusInfo.text}
                  </div>
                </div>

                <div className="mt-6 border-t border-dashed pt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Antrian di Depan</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {queueStatus.queues_in_front ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estimasi Tunggu</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {queueStatus.estimated_wait_time ?? "-"}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-sm text-gray-500">Sedang Dipanggil</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {queueStatus.current_calling_number || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pesan Aksi Berdasarkan Status */}
              <div
                className={`p-6 rounded-b-xl mt-4 flex items-center gap-4 ${
                  colorVariants[statusInfo.color]
                } border-t ${colorVariants[statusInfo.color].replace(
                  "bg-",
                  "border-"
                )}`}
              >
                {statusInfo.icon}
                <div className="flex-1">
                  <p className="font-bold">{statusInfo.message}</p>
                  {queueStatus.queue.status === "missed" && (
                    <button
                      onClick={handleRequeue}
                      disabled={actionLoading}
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
                    >
                      {actionLoading && <Spinner small />}
                      {actionLoading ? "Memproses..." : "Ambil Ulang Antrian"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // --- Pesan Jika Tidak Ditemukan ---
            !loading && (
              <div className="text-center bg-gray-50 p-8 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-700">
                  {email
                    ? `Tidak ada antrian aktif untuk "${email}"`
                    : "Silakan masukkan email Anda untuk memulai."}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Pastikan email yang dimasukkan sudah benar.
                </p>
              </div>
            )
          )}
        </main>

        <footer className="text-center mt-8 space-x-6">
          <Link
            to="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            &larr; Halaman Utama
          </Link>
          <Link
            to="/register-queue"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Daftar Antrian Baru &rarr;
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default MyQueueStatusPage;
