import React, { useEffect, useState, useRef } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Modal from "../../components/ui/Modal";
import UserForm from "../../components/forms/UserForm";
import authApi from "../../api/auth";
import toast from "react-hot-toast";

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // --- State Paginasi BARU ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7); // Menampilkan 7 data per halaman
  // --- Akhir State Paginasi BARU ---

  const effectRan = useRef(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await authApi.get("/users");
      setUsers(response.data);
      return true;
    } catch (err) {
      console.error("Gagal memuat daftar pengguna:", err);
      const msg =
        err.response?.data?.message || "Gagal memuat daftar pengguna.";
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      const success = await fetchUsers();
      if (success) {
        toast.success("Daftar pengguna berhasil dimuat!");
      }
    };

    if (effectRan.current === false) {
      loadUsers();
      effectRan.current = true;
    }
  }, []);

  // --- Logika Paginasi BARU ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(users.length / itemsPerPage);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };
  // --- Akhir Logika Paginasi BARU ---

  const handleAddUser = () => {
    setEditUserData(null);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditUserData(user);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditUserData(null);
    setFormError("");
  };

  const handleSubmitUser = async (formData) => {
    setFormLoading(true);
    setFormError("");
    try {
      if (editUserData) {
        const dataToSend = { ...formData };
        if (dataToSend.password === "") {
          delete dataToSend.password;
        }
        await authApi.put(`/users/${editUserData.id}`, dataToSend);
        toast.success("Pengguna berhasil diperbarui!");
      } else {
        await authApi.post("/users/registrasi", formData);
        toast.success("Pengguna baru berhasil ditambahkan!");
      }
      await fetchUsers(); // Refresh daftar pengguna setelah operasi
      handleCloseModal();
    } catch (err) {
      console.error("Gagal menyimpan pengguna:", err);
      setFormError(err.response?.data?.message || "Gagal menyimpan pengguna.");
      toast.error(err.response?.data?.message || "Gagal menyimpan pengguna.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
      )
    ) {
      try {
        await authApi.delete(`/users/${userId}`);
        toast.success("Pengguna berhasil dihapus!");
        await fetchUsers(); // Refresh daftar pengguna setelah hapus
      } catch (err) {
        console.error("Gagal menghapus pengguna:", err);
        toast.error(err.response?.data?.message || "Gagal menghapus pengguna.");
      }
    }
  };

  return (
    <DashboardLayout title="Manage Users">
      <div className="bg-white p-8 rounded-2xl shadow-2xl transition-all duration-300 ease-in-out">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Daftar Pengguna</h2>
          <button
            onClick={handleAddUser}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-xl transition duration-300 transform hover:scale-105"
          >
            + Tambah Pengguna Baru
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
            <p className="ml-4 text-blue-500 text-lg">Memuat pengguna...</p>
          </div>
        ) : (
          <>
            {/* Tabel Pengguna */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Nama Lengkap
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Peran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-gray-500 text-lg font-medium"
                      >
                        Tidak ada pengguna ditemukan di halaman ini.
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {user.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                          {user.role.replace("_", " ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                              user.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 mr-4 transition-colors duration-200"
                            title="Edit Pengguna"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                            title="Hapus Pengguna"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Kontrol Paginasi */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  &larr; Sebelumnya
                </button>
                <span className="text-gray-700 font-medium">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || loading}
                  className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Berikutnya &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Komponen Modal untuk Tambah/Edit Pengguna */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          editUserData
            ? `Edit Pengguna: ${editUserData.username}`
            : "Tambah Pengguna Baru"
        }
      >
        <UserForm
          onSubmit={handleSubmitUser}
          initialData={editUserData}
          isEditMode={!!editUserData}
          loading={formLoading}
          error={formError}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default ManageUsersPage;
