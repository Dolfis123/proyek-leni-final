// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth"; // Import fungsi login dari service API
import toast from "react-hot-toast"; // Import toast dari react-hot-toast
import { Helmet } from "react-helmet"; // Import Helmet untuk SEO

// --- PASTIKAN PATH GAMBAR INI BENAR SESUAI DENGAN STRUKTUR PROJECT ANDA ---
import logo from "../../images/logo/logo.png"; // Asumsi path logo
import bgImage from "../../images/logo/pnMkw.jpeg"; // Asumsi path background image
// Jika folder Anda `src/assets`, ubah menjadi:
// import logo from "../../assets/logo.png";
// import bgImage from "../../assets/pnMkw.jpeg";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // const [error, setError] = useState(""); // Dihapus, diganti toast.error
  const [loading, setLoading] = useState(false); // State untuk indikator loading tombol submit
  const [showPassword, setShowPassword] = useState(false); // State untuk mengontrol visibilitas password
  const navigate = useNavigate(); // Hook untuk navigasi programatis

  // --- Handler: Proses Login ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Mencegah refresh halaman
    // setError(""); // Dihapus
    setLoading(true); // Mulai loading

    // Validasi dasar frontend: pastikan username dan password tidak kosong
    if (!username.trim() || !password.trim()) {
        toast.warn("Username dan password wajib diisi."); // Toast peringatan
        setLoading(false); // Hentikan loading
        return; // Hentikan proses login
    }

    try {
      // Panggil fungsi login dari service API
      const data = await login(username, password);
      console.log("Login successful:", data);
      toast.success("Login berhasil!"); // Toast sukses

      // Redirect pengguna berdasarkan peran (role) yang diterima dari backend
      if (data.user.role === "super_admin") {
        navigate("/superadmin/dashboard");
      } else if (data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        // Jika peran tidak dikenali, tampilkan info dan arahkan ke halaman default
        toast.info("Peran tidak dikenali. Menuju halaman utama."); 
        navigate("/"); 
      }
    } catch (err) {
      console.error("Login error:", err);
      // Tangkap pesan error dari backend jika ada, atau pesan default
      const msg = err.message || "Login gagal. Silakan periksa kredensial Anda.";
      toast.error(msg); // Tampilkan toast error
    } finally {
      setLoading(false); // Hentikan loading
    }
  };

  // --- Render Komponen ---
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      // Mengatur gambar background menggunakan style inline
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Helmet untuk manajemen tag <head> (SEO) */}
      <Helmet>
        <title>Login - Sistem Antrian PN Manokwari</title>
        <meta
          name="description"
          content="Halaman login sistem antrian online Pengadilan Negeri Manokwari untuk Admin dan Super Admin."
        />
        <meta name="robots" content="noindex, nofollow" /> {/* Gunakan noindex, nofollow untuk halaman login */}
      </Helmet>
      {/* Container utama form login dengan styling elegan */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8">
        <div className="text-center mb-6">
          {/* Logo */}
          <img
            src={logo}
            alt="Logo Pengadilan Negeri Manokwari"
            className="mx-auto w-28 h-28 rounded-full border-4 border-white shadow-md object-cover" 
          />
          {/* Judul dan Deskripsi Aplikasi */}
          <h2 className="mt-4 text-2xl font-extrabold text-gray-800 dark:text-white leading-tight"> 
            Sistem Antrian Online
            <br />
            Pengadilan Negeri Manokwari
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 text-center">
            Masuk ke panel Admin / Super Admin untuk mengelola sistem antrian.
          </p>
        </div>

        {/* Formulir Login */}
        <form onSubmit={handleSubmit} className="space-y-6"> 
          {/* Input Username */}
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

          {/* Input Password dengan fitur show/hide */}
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
              {/* Tombol Lihat/Sembunyikan Password */}
              <div
                className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition duration-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"} {/* Emoji untuk ikon mata (Anda bisa ganti dengan ikon dari library) */}
              </div>
            </div>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            className={`w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 font-semibold shadow-lg
                        ${loading ? 'opacity-70 cursor-not-allowed' : 'transform hover:scale-105'}`} 
            disabled={loading} // Nonaktifkan tombol saat loading
          >
            {loading ? "Memuat..." : "Masuk"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"> 
          © {new Date().getFullYear()} Pengadilan Negeri Manokwari
        </div>
      </div>
    </div>
  );
};

export default LoginPage;