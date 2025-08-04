// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../api/auth";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet";

// Pastikan path gambar sudah benar
import logo from "../../images/logo/logo.png";
import bgImage from "../../images/logo/pnMkw.jpeg";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Handler untuk proses login
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
      const msg =
        err.message || "Login gagal. Silakan periksa kredensial Anda.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Komponen input yang bisa digunakan kembali (opsional)
  const FormInput = ({
    label,
    id,
    type,
    value,
    onChange,
    placeholder,
    ...props
  }) => (
    <div>
      <label
        htmlFor={id}
        className="block text-gray-700 font-semibold mb-2 text-sm"
      >
        {label}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 shadow-sm"
        required
        {...props}
      />
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4 py-12"
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

      {/* Container utama card login */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl p-10 transform transition-all duration-500 ease-in-out border border-white/40">
        {/* Header dengan logo dan judul */}
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="Logo Pengadilan Negeri Manokwari"
            className="mx-auto w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover transform transition-all duration-300 hover:scale-105"
            style={{ filter: "drop-shadow(0 0 10px rgba(100, 116, 139, 0.5))" }}
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Sistem Antrian Online
            </span>
          </h2>
          <h3 className="text-xl font-bold text-gray-700">
            Pengadilan Negeri Manokwari
          </h3>
          <p className="mt-3 text-sm text-gray-600">
            Masuk ke panel admin untuk mengelola sistem.
          </p>
        </div>

        {/* Formulir Login */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input Username (menggunakan komponen FormInput) */}
          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 font-semibold mb-2 text-sm"
            >
              Username
            </label>
            <div className="relative">
              <input
                id="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full px-5 py-3 pr-12 rounded-xl border border-gray-300 bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 shadow-sm"
                required
              />
            </div>
          </div>
          {/* <FormInput
            label="Username"
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
               placeholder="Masukkan Username"
                className="w-full px-5 py-3 pr-12 rounded-xl border border-gray-300 bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 shadow-sm"
                required
          /> */}

          {/* Input Password dengan show/hide */}
          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 font-semibold mb-2 text-sm"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full px-5 py-3 pr-12 rounded-xl border border-gray-300 bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 shadow-sm"
                required
              />
              <div
                className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 transition duration-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </div>
            </div>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            className={`w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl transition-all duration-300
                         ${
                           loading
                             ? "opacity-70 cursor-not-allowed"
                             : "hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105"
                         }`}
            disabled={loading}
          >
            {loading ? "Memuat..." : "Masuk"}
          </button>
        </form>

        {/* Tautan navigasi */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 mb-3 text-sm font-medium">
            Cari status antrian Anda atau daftar antrian baru:
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/status-display"
              className="flex-1 w-full px-6 py-2.5 rounded-lg bg-gray-200 text-gray-800 font-semibold transition-all duration-200 hover:bg-gray-300 transform hover:scale-105"
            >
              Status Publik
            </Link>
            <Link
              to="/register-queue"
              className="flex-1 w-full px-6 py-2.5 rounded-lg bg-gray-200 text-gray-800 font-semibold transition-all duration-200 hover:bg-gray-300 transform hover:scale-105"
            >
              Daftar Antrian
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Pengadilan Negeri Manokwari
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
