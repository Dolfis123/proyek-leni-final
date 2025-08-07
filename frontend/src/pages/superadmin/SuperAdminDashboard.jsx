// src/pages/superadmin/SuperAdminDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import DashboardLayout from "../../components/common/DashboardLayout";
import { getCurrentUser, getAllUsers } from "../../api/auth";
import { getAllServices } from "../../api/services";
import { getPublicQueueStatusAPI } from "../../api/queue";

// --- Komponen Ikon untuk UI yang lebih baik ---
const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8 text-indigo-500"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ServicesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8 text-emerald-500"
  >
    <path d="M2 21a8 8 0 0 1 11.8-7.2M16.5 13.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
    <path d="M18 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
    <path d="M20 17.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
    <path d="M22 19.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
  </svg>
);
const QueueIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8 text-amber-500"
  >
    <path d="M8 3H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
    <path d="M10 12H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2Z" />
    <path d="m22 7-3-3-3 3" />
    <path d="M19 10V4" />
    <path d="m22 17-3-3-3 3" />
    <path d="M19 20v-6" />
  </svg>
);
const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 mr-3"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const ReportIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 mr-3"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);
const HolidayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 mr-3"
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
    <path d="m9 16 2 2 4-4" />
  </svg>
);

// --- Komponen Kartu Statistik ---
const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center">
    <div className={`p-4 rounded-full bg-opacity-10 ${colorClass}`}>{icon}</div>
    <div className="ml-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// --- Komponen Tombol Aksi Cepat ---
const ActionButton = ({ to, text, icon, colorClass }) => (
  <Link
    to={to}
    className={`flex items-center justify-center text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${colorClass}`}
  >
    {icon}
    <span className="font-semibold">{text}</span>
  </Link>
);

const SuperAdminDashboard = () => {
  const user = getCurrentUser();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalServices: 0,
    todayQueues: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const effectRan = useRef(false);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        // Mengambil semua data secara paralel untuk efisiensi
        const [usersResponse, servicesResponse, publicQueueData] =
          await Promise.all([
            getAllUsers(),
            getAllServices(),
            getPublicQueueStatusAPI(),
          ]);

        // Menghitung total antrian aktif
        const totalActiveQueuesToday = publicQueueData.reduce(
          (total, service) => {
            return (
              total +
              service.waiting_count +
              (service.calling_number !== "---" &&
              service.calling_number !== "Kosong"
                ? 1
                : 0)
            );
          },
          0
        );

        // Memformat data untuk grafik
        const formattedChartData = publicQueueData.map((service) => ({
          name:
            service.service_name.length > 15
              ? `${service.service_name.substring(0, 15)}...`
              : service.service_name,
          antrian:
            service.waiting_count +
            (service.calling_number !== "---" &&
            service.calling_number !== "Kosong"
              ? 1
              : 0),
        }));

        setStats({
          totalUsers: usersResponse.length,
          totalServices: servicesResponse.length,
          todayQueues: totalActiveQueuesToday,
        });
        setChartData(formattedChartData);

        toast.success("Dashboard berhasil dimuat!");
      } catch (err) {
        console.error("Gagal mengambil statistik dashboard:", err);
        const msg =
          err.response?.data?.message || "Gagal memuat data dashboard.";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    if (effectRan.current === false) {
      fetchDashboardStats();
      effectRan.current = true;
    }

    return () => {
      /* Cleanup function */
    };
  }, []);

  return (
    <DashboardLayout title="Super Admin Dashboard">
      <div className="space-y-8">
        {/* --- Header --- */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Selamat Datang Kembali, {user?.full_name || user?.username}!
          </h1>
          <p className="mt-1 text-gray-500">
            Berikut adalah ringkasan aktivitas sistem hari ini.
          </p>
        </div>

        {/* --- Kartu Statistik --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading Skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center animate-pulse"
              >
                <div className="p-4 rounded-full bg-gray-200 h-16 w-16"></div>
                <div className="ml-4 flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : (
            // Data Cards
            <>
              <StatCard
                title="Total Pengguna"
                value={stats.totalUsers}
                icon={<UsersIcon />}
                colorClass="bg-indigo-100"
              />
              <StatCard
                title="Total Layanan"
                value={stats.totalServices}
                icon={<ServicesIcon />}
                colorClass="bg-emerald-100"
              />
              <StatCard
                title="Antrian Aktif Hari Ini"
                value={stats.todayQueues}
                icon={<QueueIcon />}
                colorClass="bg-amber-100"
              />
            </>
          )}
        </div>

        {/* --- Main Content: Grafik dan Aksi Cepat --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Kolom Grafik --- */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Distribusi Antrian per Layanan
            </h3>
            <div style={{ width: "100%", height: 350 }}>
              {loading ? (
                <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse"></div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(5px)",
                        borderRadius: "0.5rem",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "14px" }} />
                    <Bar
                      dataKey="antrian"
                      fill="#4f46e5"
                      name="Jumlah Antrian"
                      barSize={30}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Tidak ada data antrian untuk ditampilkan.
                </div>
              )}
            </div>
          </div>

          {/* --- Kolom Aksi Cepat --- */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Aksi Cepat
            </h3>
            <div className="space-y-4">
              <ActionButton
                to="/superadmin/users"
                text="Kelola Pengguna"
                icon={<UsersIcon />}
                colorClass="bg-indigo-500 hover:bg-indigo-600"
              />
              <ActionButton
                to="/superadmin/services"
                text="Kelola Layanan"
                icon={<ServicesIcon />}
                colorClass="bg-emerald-500 hover:bg-emerald-600"
              />
              <ActionButton
                to="/superadmin/settings"
                text="Pengaturan Sistem"
                icon={<SettingsIcon />}
                colorClass="bg-slate-500 hover:bg-slate-600"
              />
              <ActionButton
                to="/superadmin/holidays"
                text="Kelola Hari Libur"
                icon={<HolidayIcon />}
                colorClass="bg-rose-500 hover:bg-rose-600"
              />
              <ActionButton
                to="/superadmin/reports"
                text="Laporan Antrian"
                icon={<ReportIcon />}
                colorClass="bg-gray-700 hover:bg-gray-800"
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
