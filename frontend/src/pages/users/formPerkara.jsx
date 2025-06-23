import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // Import useNavigate
import NomorAntrianStatus from './NomorAntrianStatus';  // Import komponen NomorAntrianStatus

function FormPerkara() {
  const [formData, setFormData] = useState({
    user_name: '',
    user_ktp: '',
    user_contact: '',
    nomor_whatsapp: '',  // Sesuaikan dengan nama kolom di DB
    nomor_telepon: '',
    user_email: '',
    otp_code: '',
    otp_verified: false,
  });

  const [step, setStep] = useState(1); // Step 1 = input form, Step 2 = OTP input
  const [nomorAntrian, setNomorAntrian] = useState(null);
  const [statusAntrian, setStatusAntrian] = useState(null);
  const navigate = useNavigate();  // Inisialisasi useNavigate untuk navigasi
  // Handle input perubahan
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value.trim(),  // Menambahkan trim untuk menghapus spasi di awal/akhir
    }));
  };

  // Validasi format email
  const validateEmail = (email) => {
    const regex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    return regex.test(email);
  };

  const validatePhone = (phone) => {
    const regex = /^\+?[0-9]{10,20}$/; // Memperbolehkan tanda '+' di depan dan angka 10-20 digit
    return regex.test(phone);
  };
  
  const validateInput = () => {
    if (!formData.user_name || formData.user_name.trim().length === 0) {
      return 'Nama tidak boleh kosong';
    }
    if (!formData.user_ktp || formData.user_ktp.trim().length !== 16) {
      return 'Nomor KTP harus terdiri dari 16 digit';
    }
    if (!formData.user_contact || !validatePhone(formData.user_contact)) {
      return 'Nomor kontak tidak valid';
    }
    if (!formData.nomor_whatsapp || !validatePhone(formData.nomor_whatsapp)) {
      return 'Nomor WhatsApp tidak valid';
    }
    if (!formData.nomor_telepon || !validatePhone(formData.nomor_telepon)) {
      return 'Nomor telepon tidak valid';
    }
    if (!formData.user_email || !validateEmail(formData.user_email)) {
      return 'Email tidak valid';
    }
    return null;
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validasi input terlebih dahulu
    const validationError = validateInput();
    if (validationError) {
      alert(validationError);
      return;
    }
  
    try {
      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: formData.user_name,
          user_ktp: formData.user_ktp,
          user_contact: formData.user_contact,
          nomor_whatsapp: formData.nomor_whatsapp,  // Kirim nomor WhatsApp yang diinput
          user_email: formData.user_email,
        }),
      });
  
      const data = await response.json();
      if (data.success) {
        setStep(2);
        alert('OTP berhasil dikirim!');
      } else {
        alert(data.message || 'Gagal mengirim OTP.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Terjadi kesalahan saat mengirim OTP.');
    }
  };
  
  
// Verifikasi OTP + Simpan Data dan Navigasi ke Halaman Nomor Antrian
const handleVerifyOTP = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_ktp: formData.user_ktp,
        otp_code: formData.otp_code,
      }),
    });

    const data = await response.json();
    if (data.success) {
      setFormData(prevData => ({ ...prevData, otp_verified: true }));
      setNomorAntrian(data.data.nomor_antrian);
      setStatusAntrian(data.data.status_antrian);

      // Navigasi ke halaman nomor antrian setelah OTP berhasil diverifikasi
      navigate(`/nomor-antrian/${data.data.id}`, {
        state: {
          nomorAntrian: data.data.nomor_antrian,
          statusAntrian: data.data.status_antrian,
        },
      });
      

      alert('OTP berhasil diverifikasi dan data sudah tersimpan!');
    } else {
      alert(data.message || 'OTP salah. Silakan coba lagi.');
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    alert('Terjadi kesalahan saat verifikasi OTP.');
  }
};

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-lg mt-10">
      <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
        Pendaftaran Perkara
      </h2>

      {/* Step 1: Form Input */}
      {step === 1 && (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="user_name" className="block text-sm font-medium text-gray-600">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="user_name"
                name="user_name"
                value={formData.user_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* No KTP */}
            <div>
              <label htmlFor="user_ktp" className="block text-sm font-medium text-gray-600">
                Nomor KTP
              </label>
              <input
                type="text"
                id="user_ktp"
                name="user_ktp"
                value={formData.user_ktp}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Kontak Telepon */}
            <div>
              <label htmlFor="user_contact" className="block text-sm font-medium text-gray-600">
                Nomor Telepon
              </label>
              <input
                type="text"
                id="user_contact"
                name="user_contact"
                value={formData.user_contact}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* No WhatsApp */}
            <div>
              <label htmlFor="nomor_whatsapp" className="block text-sm font-medium text-gray-600">
                Nomor WhatsApp
              </label>
              <input
                type="text"
                id="nomor_whatsapp"
                name="nomor_whatsapp"
                value={formData.nomor_whatsapp}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Nomor Telepon Lain */}
            <div>
              <label htmlFor="nomor_telepon" className="block text-sm font-medium text-gray-600">
                Nomor Telepon Lain
              </label>
              <input
                type="text"
                id="nomor_telepon"
                name="nomor_telepon"
                value={formData.nomor_telepon}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="user_email" className="block text-sm font-medium text-gray-600">
                Email
              </label>
              <input
                type="email"
                id="user_email"
                name="user_email"
                value={formData.user_email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Kirim OTP
            </button>
          </div>
        </form>
      )}

      {/* Step 2: OTP Verification */}
      {step === 2 && !formData.otp_verified && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-center text-gray-700 mb-4">
            Verifikasi OTP
          </h3>
          <div>
            <label htmlFor="otp_code" className="block text-sm font-medium text-gray-600">
              Masukkan Kode OTP
            </label>
            <input
              type="text"
              id="otp_code"
              name="otp_code"
              value={formData.otp_code}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="button"
            onClick={handleVerifyOTP}
            className="w-full mt-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Verifikasi OTP
          </button>
        </div>
      )}

      {/* Step 3: Berhasil */}
      {formData.otp_verified && (
        <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-md text-center">
           <NomorAntrianStatus nomorAntrian={nomorAntrian} statusAntrian={statusAntrian} />
          <h3 className="text-lg font-semibold">Pendaftaran Berhasil!</h3>
          <p>Data Anda sudah tersimpan dan akan diproses oleh petugas.</p>
        </div>
      )}
    </div>
  );
}

export default FormPerkara;
