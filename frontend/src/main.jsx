// src/main.jsx (atau src/index.js)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Pastikan CSS global Anda diimpor di sini
import { BrowserRouter } from 'react-router-dom'; // <--- PASTIKAN INI DIIMPORT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <--- WRAP APP DENGAN BROWSERROUTER DI SINI */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);