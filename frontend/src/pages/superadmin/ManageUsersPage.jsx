// src/pages/superadmin/ManageUsersPage.jsx
import React, { useEffect, useState, useRef } from 'react'; // <<< TAMBAH useRef
import DashboardLayout from '../../components/common/DashboardLayout';
import Modal from '../../components/ui/Modal';
import UserForm from '../../components/forms/UserForm';
import authApi from '../../api/auth';
import toast from 'react-hot-toast'; 

const ManageUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editUserData, setEditUserData] = useState(null);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const effectRan = useRef(false); // <<< BARU: useRef untuk melacak eksekusi useEffect

    const fetchUsers = async () => {
        console.log('[ManageUsersPage] fetchUsers called'); // DEBUGGING
        setLoading(true);
        try {
            const response = await authApi.get('/users');
            setUsers(response.data);
            console.log('[ManageUsersPage] fetchUsers completed successfully'); // DEBUGGING
            return true; 
        } catch (err) {
            console.error('[ManageUsersPage] fetchUsers failed:', err); // DEBUGGING
            const msg = err.response?.data?.message || 'Gagal memuat daftar pengguna.';
            toast.error(msg); 
            return false; 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // DEBUGGING: Log setiap kali useEffect dieksekusi
        console.log('[ManageUsersPage] useEffect (loadUsers) triggered');

        // Ini adalah pola untuk mencegah duplikasi di StrictMode pada development
        // Akan memicu loadUsers dua kali, tapi toast.success hanya muncul sekali secara visual
        // Namun, karena masalah masih ada, kita akan melihat log lebih detail
        const loadUsers = async () => {
            const success = await fetchUsers();
            if (success) {
                console.log('[ManageUsersPage] loadUsers successful, attempting to show toast'); // DEBUGGING
                toast.success('Daftar pengguna berhasil dimuat!');
            }
        };

        // Menggunakan effectRan.current untuk memastikan loadUsers hanya dijalankan sekali per mount
        // Ini adalah workaround untuk React 18 Strict Mode yang ketat, kadang diperlukan
        if (effectRan.current === false) { // <<< BARU: Cek flag
            loadUsers();
            effectRan.current = true; // <<< BARU: Set flag
        }

        // Cleanup function (tidak relevan untuk kasus ini, tapi praktik baik)
        return () => {
            console.log('[ManageUsersPage] useEffect cleanup triggered'); // DEBUGGING
            // Jika ingin mereset flag untuk testing remount, bisa dilakukan di sini
            // effectRan.current = false; 
        };
    }, []); 

    const handleAddUser = () => {
        console.log('[ManageUsersPage] handleAddUser called'); // DEBUGGING
        setEditUserData(null);
        setFormError('');
        setIsModalOpen(true);
    };

    const handleEditUser = (user) => {
        console.log('[ManageUsersPage] handleEditUser called', user); // DEBUGGING
        setEditUserData(user);
        setFormError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        console.log('[ManageUsersPage] handleCloseModal called'); // DEBUGGING
        setIsModalOpen(false);
        setEditUserData(null);
        setFormError('');
    };

    const handleSubmitUser = async (formData) => {
        console.log('[ManageUsersPage] handleSubmitUser called', formData); // DEBUGGING
        setFormLoading(true);
        setFormError(''); 
        try {
            if (editUserData) {
                const dataToSend = { ...formData };
                if (dataToSend.password === '') { 
                    delete dataToSend.password;
                }
                await authApi.put(`/users/${editUserData.id}`, dataToSend);
                toast.success('Pengguna berhasil diperbarui!'); 
            } else {
                await authApi.post('/users', formData);
                toast.success('Pengguna baru berhasil ditambahkan!'); 
            }
            await fetchUsers(); // Panggil ulang untuk refresh daftar (ini tidak akan memicu toast daftar ganda)
            handleCloseModal(); 
        } catch (err) {
            console.error('[ManageUsersPage] handleSubmitUser failed:', err); // DEBUGGING
            setFormError(err.response?.data?.message || 'Gagal menyimpan pengguna.'); 
            toast.error(err.response?.data?.message || 'Gagal menyimpan pengguna.'); 
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        console.log('[ManageUsersPage] handleDeleteUser called', userId); // DEBUGGING
        if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.')) {
            try {
                await authApi.delete(`/users/${userId}`);
                toast.success('Pengguna berhasil dihapus!'); 
                await fetchUsers(); 
            } catch (err) {
                console.error('[ManageUsersPage] handleDeleteUser failed:', err); // DEBUGGING
                toast.error(err.response?.data?.message || 'Gagal menghapus pengguna.'); 
            }
        }
    };

    // DEBUGGING: Log setiap kali komponen dirender
    console.log('[ManageUsersPage] Component Render'); 

    return (
        <DashboardLayout title="Manage Users">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Daftar Pengguna</h2>
                    <button
                        onClick={handleAddUser}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
                    >
                        + Tambah Pengguna Baru
                    </button>
                </div>

                {loading && <p className="text-blue-500 text-center">Memuat pengguna...</p>}

                {!loading && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Lengkap</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peran</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Tidak ada pengguna ditemukan.</td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.full_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{user.role.replace('_', ' ')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="text-red-600 hover:text-red-900"
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
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editUserData ? `Edit Pengguna: ${editUserData.username}` : 'Tambah Pengguna Baru'}
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