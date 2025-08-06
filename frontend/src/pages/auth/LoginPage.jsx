import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../api/auth";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet";

// Pastikan path gambar sudah benar
import logo from "../../images/logo/logo.png";
import bgImage from "../../images/logo/pnMkw.jpeg";

// --- Komponen Ikon SVG untuk tampilan yang lebih bersih dan profesional ---
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-400"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    />
  </svg>
);
const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-400"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
      clipRule="evenodd"
    />
  </svg>
);
const EyeOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);
const EyeClosedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.669.105 2.458.31M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2 2l20 20"
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

const LoginPage = () => {
  // ... (SEMUA STATE DAN LOGIKA ANDA TETAP SAMA, TIDAK PERLU DIUBAH)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen w-full bg-gray-200">
      <Helmet>
        <title>Login Panel - Sistem Antrian PN Manokwari</title>
        <meta
          name="description"
          content="Halaman login sistem antrian online Pengadilan Negeri Manokwari untuk Admin dan Super Admin."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-200">
          {/* Header dengan logo dan judul */}
          <div className="text-center mb-8">
            <img
              src={logo}
              alt="Logo Pengadilan Negeri Manokwari"
              className="mx-auto w-24 h-24 object-contain"
            />
            <h2 className="mt-6 text-2xl font-bold text-slate-800">
              Portal Staf & Admin
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Pengadilan Negeri Manokwari
            </p>
          </div>

          {/* Formulir Login */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700"
              >
                Username
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  tabIndex={-1}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  Lupa Password?
                </Link>
              </div>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-gray-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                  required
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-0 -translate-y-1/2 px-4 py-2 text-slate-500 hover:text-slate-700"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Tampilkan atau sembunyikan password"
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-semibold text-base shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              disabled={loading}
            >
              {loading && <Spinner />}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Tautan kembali */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              ← Kembali ke Halaman Publik
            </Link>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-white/70">
          © {new Date().getFullYear()} Pengadilan Negeri Manokwari
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
