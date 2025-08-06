// controllers/userController.js
const db = require("../models"); // Mengimpor semua model Sequelize
const User = db.User; // Mengambil model User

// Mendapatkan daftar semua user (hanya untuk Super Admin)
const getAllUsers = async (req, res) => {
  try {
    // Dapatkan semua user menggunakan Sequelize
    const users = await User.findAll({
      attributes: [
        "id",
        "username",
        "full_name",
        "email",
        "role",
        "is_active",
        "created_at",
      ], // Pilih atribut yang ingin ditampilkan
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({ message: "Error retrieving users." });
  }
};

// Membuat user baru (oleh Super Admin)
const createUser = async (req, res) => {
  const { username, password, full_name, email, role } = req.body;

  if (!username || !password || !full_name || !email || !role) {
    return res.status(400).json({
      message:
        "All fields (username, password, full_name, email, role) are required.",
    });
  }
  if (!["admin"].includes(role)) {
    // Hanya izinkan membuat role 'admin' dari API ini
    return res.status(400).json({ message: "Invalid role specified." });
  }

  try {
    const existingUser = await User.findOne({ where: { username: username } });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const newUser = await User.create({
      username: username,
      password_hash: password,
      full_name: full_name,
      email: email,
      role: role,
    });
    res
      .status(201)
      .json({ message: "User created successfully!", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user." });
  }
};

// Memperbarui user (oleh Super Admin)
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, password, full_name, email, role, is_active } = req.body;

  if (!id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  try {
    const user = await User.findByPk(id); // Cari user berdasarkan Primary Key (id)
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Pastikan Super Admin tidak bisa mengubah role-nya sendiri menjadi non-super_admin
    // atau mengubah role super_admin lain menjadi admin
    if (
      req.user.role === "super_admin" &&
      user.role === "super_admin" &&
      role === "admin" &&
      user.id !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Cannot downgrade another Super Admin role." });
    }
    if (
      req.user.role === "super_admin" &&
      user.id === req.user.id &&
      role &&
      role !== "super_admin"
    ) {
      return res
        .status(403)
        .json({ message: "Super Admin cannot downgrade their own role." });
    }

    // Update data user
    const updateData = {};
    if (username) updateData.username = username;
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (password) updateData.password_hash = password; // Password akan di-hash oleh hooks beforeUpdate di model

    await user.update(updateData); // Lakukan update menggunakan instance model

    res.status(200).json({ message: "User updated successfully." });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "Username or Email already exists." });
    }
    res.status(500).json({ message: "Error updating user." });
  }
};

// Menghapus user (oleh Super Admin)
const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  // Super Admin tidak bisa menghapus dirinya sendiri
  if (req.user.id == id) {
    return res
      .status(403)
      .json({ message: "You cannot delete your own account." });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await user.destroy(); // Hapus user menggunakan instance model

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user." });
  }
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser };
