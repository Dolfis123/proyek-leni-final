// src/pages/superadmin/ManageUsersPage.jsx
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Modal from '../../components/ui/Modal'; // Import komponen Modal
import UserForm from '../../components/forms/UserForm'; // Import komponen UserForm
import authApi from '../../../api/auth'; // Menggunakan instance axios yang sudah dikonfigurasi

const ManageUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editUserData, setEditUserData] = useState(null); // Data user yang akan diedit
    const [formError, setFormError] = useState(''); // Error dari form modal
    const [formLoading, setFormLoading] = useState(false); // Loading state untuk form modal

    // Fungsi untuk mengambil data user
    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await authApi.get('/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError(err.response?.data?.message || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Buka modal untuk tambah user
    const handleAddUser = () => {
        setEditUserData(null); // Pastikan tidak ada data edit
        setFormError('');
        setIsModalOpen(true);
    };

    // Buka modal untuk edit user
    const handleEditUser = (user) => {
        setEditUserData(user); // Set data user yang akan diedit
        setFormError('');
        setIsModalOpen(true);
    };

    // Tutup modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditUserData(null);
        setFormError('');
    };

    // Submit form (Add atau Edit)
    const handleSubmitUser = async (formData) => {
        setFormLoading(true);
        setFormError('');
        try {
            if (editUserData) {
                // Mode Edit
                const dataToSend = { ...formData };
                if (dataToSend.password === '') { // Jika password kosong, jangan kirim password
                    delete dataToSend.password;
                }
                await authApi.put(`/users/${editUserData.id}`, dataToSend);
                console.log('User updated successfully');
            } else {
                // Mode Add
                await authApi.post('/users', formData);
                console.log('User added successfully');
            }
            await fetchUsers(); // Refresh daftar user
            handleCloseModal(); // Tutup modal
        } catch (err) {
            console.error('Failed to save user:', err);
            setFormError(err.message || 'Failed to save user.');
        } finally {
            setFormLoading(false);
        }
    };

    // Hapus User
    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await authApi.delete(`/users/${userId}`);
                console.log('User deleted successfully');
                await fetchUsers(); // Refresh daftar user
            } catch (err) {
                console.error('Failed to delete user:', err);
                setError(err.response?.data?.message || 'Failed to delete user.');
            }
        }
    };

    return (
        <DashboardLayout title="Manage Users">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Users List</h2>
                    <button
                        onClick={handleAddUser}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
                    >
                        + Add New User
                    </button>
                </div>

                {loading && <p className="text-blue-500 text-center">Loading users...</p>}
                {error && <p className="text-red-500 text-center">{error}</p>}

                {!loading && !error && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
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
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && !loading && (
                            <p className="text-center text-gray-500 py-4">No users found.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Add/Edit User Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editUserData ? `Edit User: ${editUserData.username}` : 'Add New User'}
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