import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Beranda() {
  const [loading, setLoading] = useState(true);
  const [pelayanan, setPelayanan] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pelayananPerPage] = useState(8);

  useEffect(() => {
    // Data layanan PTSP
    const dummyData = [
      {
        path: "/perkara",
        judul: "Pendaftaran Perkara",
        deskripsi:
          "Layanan untuk mendaftarkan perkara perdata, pidana, atau lainnya ke pengadilan.",
        gambar: "pendaftaran_perkara.jpg",
      },
      {
        path: "/permohonan-surat-keterangan",
        judul: "Permohonan Surat Keterangan",
        deskripsi:
          "Permohonan surat keterangan seperti surat tidak pernah dipidana atau surat ahli waris.",
        gambar: "permohonan_surat_keterangan.jpg",
      },
      {
        path: "/pengajuan-upaya-hukum",
        judul: "Pengajuan Upaya Hukum",
        deskripsi:
          "Layanan pengajuan banding, kasasi, atau peninjauan kembali terhadap putusan pengadilan.",
        gambar: "pengajuan_upaya_hukum.jpg",
      },
      {
        path: "/pengambilan-salinan-putusan",
        judul: "Pengambilan Salinan Putusan",
        deskripsi:
          "Layanan untuk mengambil salinan resmi putusan pengadilan setelah perkara selesai.",
        gambar: "pengambilan_salinan_putusan.jpg",
      },
      {
        path: "/layanan-pengaduan",
        judul: "Layanan Pengaduan",
        deskripsi:
          "Layanan untuk masyarakat yang ingin mengajukan pengaduan terkait pelayanan atau dugaan pelanggaran.",
        gambar: "layanan_pengaduan.jpg",
      },
      {
        path: "/pendaftaran-medisiasi",
        judul: "Pendaftaran Mediasi",
        deskripsi:
          "Layanan untuk mendaftarkan permohonan penyelesaian sengketa melalui proses mediasi.",
        gambar: "pendaftaran_medisiasi.jpg",
      },
      {
        path: "/permohonan-izin-penyitaan-penahanan",
        judul: "Permohonan Izin Penyitaan/Penahanan",
        deskripsi:
          "Layanan bagi penyidik untuk mengajukan izin penyitaan atau penahanan dari pengadilan.",
        gambar: "permohonan_izin_penyitaan.jpg",
      },
      {
        path: "/permohonan-bantuan-panggilan",
        judul: "Permohonan Bantuan Panggilan/Pemberitahuan",
        deskripsi:
          "Permohonan bantuan kepada pengadilan lain untuk melakukan pemanggilan atau pemberitahuan.",
        gambar: "permohonan_bantuan_panggilan.jpg",
      },
    ];

    // Set data dummy
    setPelayanan(dummyData);
    setLoading(false);
  }, []);

  const indexOfLastPelayanan = currentPage * pelayananPerPage;
  const indexOfFirstPelayanan = indexOfLastPelayanan - pelayananPerPage;
  const currentPelayanan = pelayanan.slice(
    indexOfFirstPelayanan,
    indexOfLastPelayanan
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(pelayanan.length / pelayananPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div>
      {/* Hero Section */}
      <div
        className="bg-cover bg-center py-32"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1650509009946-32b00cb21a0a?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        }}
      >
        <div className="text-center text-white">
          <h1 className="text-5xl font-semibold mb-4">Pelayanan PTSP</h1>
          <p className="text-xl">Pilih layanan yang Anda butuhkan</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto py-16 px-4">
        <h2 className="text-3xl font-semibold text-center mb-10">
          Daftar Pelayanan PTSP
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-4 text-center">Loading...</div>
          ) : (
            currentPelayanan.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <Link to={item.path}>
                  <img
                    src={`https://via.placeholder.com/300?text=${item.gambar}`}
                    alt={item.judul}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-indigo-600">
                      {item.judul}
                    </h3>
                    <p className="text-gray-600 mt-2">{item.deskripsi}</p>
                  </div>
                </Link>
                <div className="p-4">
                  <Link
                    to={item.path}
                    className="text-indigo-600 hover:underline"
                  >
                    Ajukan Layanan
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex justify-center">
          <nav>
            <ul className="flex space-x-4">
              {pageNumbers.map((number) => (
                <li key={number}>
                  <button
                    onClick={() => paginate(number)}
                    className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    {number}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default Beranda;
