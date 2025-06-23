// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // <<< TAMBAHKAN Link
import { login } from "../../api/auth";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet";

import logo from "../../images/logo/logo.png";
import bgImage from "../../images/logo/pnMkw.jpeg";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // --- Handler: Proses Login ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      toast.warn("Username dan password wajib diisi.");
      setLoading(false);
      return;
    }

    try {
      const data = await login(username, password);
      console.log("Login successful:", data);
      toast.success("Login berhasil!");

      if (data.user.role === "super_admin") {
        navigate("/superadmin/dashboard");
      } else if (data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        toast.info("Peran tidak dikenali. Menuju halaman utama.");
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      const msg = err.message || "Login gagal. Silakan periksa kredensial Anda.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- Render Komponen ---
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <Helmet>
        <title>Login - Sistem Antrian PN Manokwari</title>
        <meta
          name="description"
          content="Halaman login sistem antrian online Pengadilan Negeri Manokwari untuk Admin dan Super Admin."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8">
        <div className="text-center mb-6">
          <img
            src={logo}
            alt="Logo Pengadilan Negeri Manokwari"
            className="mx-auto w-28 h-28 rounded-full border-4 border-white shadow-md object-cover"
          />
          <h2 className="mt-4 text-2xl font-extrabold text-gray-800 dark:text-white leading-tight">
            Sistem Antrian Online
            <br />
            Pengadilan Negeri Manokwari
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 text-center">
            Masuk ke panel Admin / Super Admin untuk mengelola sistem antrian.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
              />
              <div
                className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition duration-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 font-semibold shadow-lg
                         ${loading ? 'opacity-70 cursor-not-allowed' : 'transform hover:scale-105'}`}
            disabled={loading}
          >
            {loading ? "Memuat..." : "Masuk"}
          </button>
        </form>

        {/* --- BARU: Tambahan Link ke Status Display dan Register Queue --- */}
        <div className="mt-6 text-center text-sm">
          <Link to="/status-display" className="text-blue-500 dark:text-blue-400 hover:underline font-medium">
            Lihat Status Antrian Publik
          </Link>
          <span className="mx-2 text-gray-400">|</span>
          <Link to="/register-queue" className="text-purple-500 dark:text-purple-400 hover:underline font-medium">
            Daftar Antrian Baru
          </Link>
        </div>
        {/* --- AKHIR BARU --- */}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Pengadilan Negeri Manokwari
        </div>
      </div>
    </div>
  );
};

export default LoginPage;