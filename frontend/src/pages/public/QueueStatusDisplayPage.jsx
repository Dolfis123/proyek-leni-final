import React, { useEffect, useState, useRef, useMemo } from "react";
import socket from "../../api/socket";
import { getPublicQueueStatusAPI } from "../../api/queue";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

// --- Komponen Tambahan untuk UI ---

// Komponen Jam Digital Real-time
const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Jayapura",
    };
    return new Intl.DateTimeFormat("id-ID", options).format(date);
  };

  return (
    <div className="text-center">
      <p className="text-4xl md:text-5xl font-bold text-gray-800 tracking-wider">
        {formatTime(time)}
      </p>
      <p className="text-sm md:text-base text-gray-500 mt-1">
        {formatDate(time)} WIT
      </p>
    </div>
  );
};

// Komponen Spinner Loading
const Spinner = () => (
  <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
    <svg
      className="animate-spin h-12 w-12 text-indigo-600"
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
    <p className="mt-4 text-lg font-semibold text-gray-600">
      Memuat Status Antrian Real-time...
    </p>
  </div>
);

// Komponen untuk setiap Kartu Antrian
const QueueCard = ({ service }) => {
  const [animated, setAnimated] = useState(false);
  const prevCallingNumber = useRef(service.calling_number);

  useEffect(() => {
    if (prevCallingNumber.current !== service.calling_number) {
      setAnimated(true);
      const timer = setTimeout(() => setAnimated(false), 500); // Durasi animasi
      prevCallingNumber.current = service.calling_number;
      return () => clearTimeout(timer);
    }
  }, [service.calling_number]);

  // Warna border atas yang berbeda untuk setiap layanan agar lebih mudah dibedakan
  const borderColors = [
    "border-blue-500",
    "border-green-500",
    "border-yellow-500",
    "border-red-500",
  ];
  const borderColor = borderColors[service.id % borderColors.length];

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border-t-8 ${borderColor} transition-shadow duration-300 hover:shadow-2xl flex flex-col`}
    >
      {/* Header Kartu */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 text-center">
          {service.service_name}
        </h2>
      </div>

      {/* Konten Utama Kartu */}
      <div className="flex-grow p-6 flex flex-col justify-center items-center">
        <p className="text-base font-semibold text-gray-500 mb-2">
          NOMOR DIPANGGIL
        </p>
        <div
          className={`w-full text-center py-4 rounded-lg transition-all duration-300 ${
            service.calling_number &&
            service.calling_number !== "---" &&
            service.calling_number !== "Kosong"
              ? "bg-blue-100"
              : "bg-gray-100"
          }`}
        >
          <p
            className={`font-extrabold tracking-tighter transition-all duration-300 ${
              animated ? "scale-125" : "scale-100"
            } ${
              service.calling_number &&
              service.calling_number !== "---" &&
              service.calling_number !== "Kosong"
                ? "text-7xl text-blue-600"
                : "text-4xl text-gray-400"
            }`}
          >
            {service.calling_number || "---"}
          </p>
        </div>
      </div>

      {/* Footer Kartu */}
      <div className="bg-gray-50 p-4 rounded-b-2xl border-t border-gray-100 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-500 font-medium">Menunggu</p>
          <p className="text-2xl font-bold text-gray-800">
            {service.waiting_count}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Estimasi</p>
          <p className="text-2xl font-bold text-gray-800">
            {service.estimated_wait_time}
          </p>
        </div>
      </div>
    </div>
  );
};

const QueueStatusDisplayPage = () => {
  const [publicStatus, setPublicStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const effectRan = useRef(false);

  // Logika fungsional Anda tetap sama
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const data = await getPublicQueueStatusAPI();
        setPublicStatus(data);
      } catch (err) {
        toast.error(err.message || "Gagal memuat status antrian.");
      } finally {
        setLoading(false);
      }
    };

    if (effectRan.current === false) {
      fetchInitialData();
      effectRan.current = true;
    }

    socket.on("queue_update", (data) => {
      setPublicStatus(data);
    });

    return () => {
      socket.off("queue_update");
    };
  }, []);

  const filteredServices = useMemo(() => {
    if (!searchQuery) {
      return publicStatus;
    }
    return publicStatus.filter((service) =>
      service.service_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [publicStatus, searchQuery]);

  // Paginasi tidak lagi digunakan di desain baru, semua ditampilkan
  // Jika Anda tetap ingin paginasi, bagian ini bisa diaktifkan kembali
  // const [currentPage, setCurrentPage] = useState(1);
  // const [itemsPerPage] = useState(4);
  // const indexOfLastService = currentPage * itemsPerPage;
  // const indexOfFirstService = indexOfLastService - itemsPerPage;
  // const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService);
  // const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center gap-4">
            {/* Ganti dengan logo Anda */}
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
              PN
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Pengadilan Negeri Manokwari
              </h1>
              <p className="text-gray-500">Papan Informasi Antrian</p>
            </div>
          </div>
          <div className="md:col-span-2">
            <Clock />
          </div>
        </header>

        <div className="mb-8 p-4 bg-white rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-200">
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Cari Layanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/register-queue"
              className="w-full text-center md:w-auto px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Ambil Antrian Baru
            </Link>
            <Link
              to="/login"
              className="w-full text-center md:w-auto px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Login Staf
            </Link>
          </div>
        </div>

        <main>
          {filteredServices.length === 0 && !loading ? (
            <div className="text-center bg-white p-12 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-gray-700">
                Tidak Ada Antrian Aktif
              </h2>
              <p className="text-gray-500 mt-2">
                Saat ini tidak ada layanan yang aktif atau cocok dengan
                pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
              {filteredServices.map((service) => (
                <QueueCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </main>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Pengadilan Negeri Manokwari. Sistem
          Antrian Digital.
        </footer>
      </div>
    </div>
  );
};

export default QueueStatusDisplayPage;
