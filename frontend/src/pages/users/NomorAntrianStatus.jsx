import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';  // Tambahkan ini untuk ambil ID dari URL

function NomorAntrianStatus() {
  const { id } = useParams(); // Ambil ID dari parameter URL
  const [status, setStatus] = useState('menunggu'); // Default status
  const [nomor, setNomor] = useState(null); // Default nomor antrian null
  const [loading, setLoading] = useState(true);

  // Fetch data pendaftaran berdasarkan ID
  const fetchData = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/${id}`);
      const data = await response.json();

      if (data.success) {
        setNomor(data.data.nomor_antrian);
        setStatus(data.data.status_antrian);
      } else {
        alert('Data pendaftaran tidak ditemukan.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Terjadi kesalahan saat mengambil data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }

    // Koneksi ke WebSocket
    const socket = io('http://localhost:8080');

    // Update status real-time berdasarkan event dari server
    socket.on('statusUpdate', (data) => {
      if (data.id === parseInt(id)) {  // Cek ID bukan nomor antrian
        setNomor(data.nomor_antrian);
        setStatus(data.status_antrian);
      }
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [id]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-lg mt-10">
      <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
        Informasi Antrian
      </h2>

      <div className="space-y-4 text-center">
        <div>
          <h3 className="text-lg font-medium text-gray-600">Nomor Antrian Anda</h3>
          <p className="text-2xl font-bold text-indigo-600">{nomor}</p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-600">Status Antrian</h3>
          <p className={`text-xl font-semibold ${status === 'menunggu' ? 'text-yellow-500' : status === 'dipanggil' ? 'text-green-500' : 'text-red-500'}`}>
            {status === 'menunggu' && 'Menunggu giliran Anda'}
            {status === 'dipanggil' && 'Anda dipanggil, harap datang ke petugas'}
            {status === 'tidak hadir' && 'Anda tidak hadir, silakan mendaftar ulang'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default NomorAntrianStatus;
