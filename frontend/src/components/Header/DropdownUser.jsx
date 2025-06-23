import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ClickOutside from '../ClickOutside';
import UserOne from '../../images/user/user-01.jpg';

const DropdownUser = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('administrator'); // default

  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const openLogoutModal = () => {
    setIsModalOpen(true);
  };

  const closeLogoutModal = () => {
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <Link
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4"
        to="#"
      >
        <span className="hidden text-right lg:block">
          <span className="block text-sm font-medium text-black dark:text-white">
            {username ? username : 'administrator'}
          </span>
          {/* Status online */}
          <span className="flex items-center gap-1 text-xs text-green-500">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            Online
          </span>
        </span>

        <span className="h-12 w-12 rounded-full">
          <img src={UserOne} alt="User" />
        </span>

        <svg
          className="hidden fill-current sm:block"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.410765 0.910734C0.736202 0.585297 1.26384 0.585297 1.58928 0.910734L6.00002 5.32148L10.4108 0.910734C10.7362 0.585297 11.2638 0.585297 11.5893 0.910734C11.9147 1.23617 11.9147 1.76381 11.5893 2.08924L6.58928 7.08924C6.26384 7.41468 5.7362 7.41468 5.41077 7.08924L0.410765 2.08924C0.0853277 1.76381 0.0853277 1.23617 0.410765 0.910734Z"
            fill=""
          />
        </svg>
      </Link>

      {/* Dropdown Start */}
      {dropdownOpen && (
        <div
          className={`absolute right-0 mt-4 flex w-62.5 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark`}
        >
          <ul className="flex flex-col gap-5 border-b border-stroke px-6 py-7.5 dark:border-strokedark">
            <li>
              <Link
                to="#"
                className="flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
              >
                <svg
                  className="fill-current"
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* SVG Path for Profile */}
                </svg>
                My Profile
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
              >
                <svg
                  className="fill-current"
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* SVG Path for Contacts */}
                </svg>
                My Contacts
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className="flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
              >
                <svg
                  className="fill-current"
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* SVG Path for Settings */}
                </svg>
                Account Settings
              </Link>
            </li>
          </ul>
          <button
            onClick={openLogoutModal} // Panggil modal saat user klik logout
            className="flex items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
          >
            <svg
              className="fill-current"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* SVG Path for Logout */}
            </svg>
            Keluar
          </button>
        </div>
      )}

      {/* Modal Logout Confirmation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/3">
            <h2 className="text-xl font-bold mb-4">Konfirmasi keluar</h2>
            <p>Apakah Anda yakin ingin keluar ?</p>
            <div className="mt-4 flex justify-end">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={handleLogout} // Jalankan logout jika user konfirmasi
              >
                Ya
              </button>
              <button
                className="ml-2 bg-neutral-500 text-white px-4 py-2 rounded"
                onClick={closeLogoutModal} // Tutup modal jika user batal
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown End */}
    </ClickOutside>
  );
};

export default DropdownUser;
