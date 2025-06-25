// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');

// Memuat variabel lingkungan dari file .env
// Penting: Pastikan file .env berada di root folder backend
require('dotenv').config(); 
console.log('[DEBUG] .env file loaded.');

// Import database dari models/index.js (Sequelize)
// Menambahkan import Op dari Sequelize untuk digunakan dalam query
const db = require('./models');
const { Op } = require('sequelize'); // Import Op dari Sequelize

// Log konfigurasi database yang dibaca dari .env
console.log(`[DEBUG] DB_HOST: ${process.env.DB_HOST}`);
console.log(`[DEBUG] DB_USER: ${process.env.DB_USER}`);
console.log(`[DEBUG] DB_NAME: ${process.env.DB_NAME}`);
console.log(`[DEBUG] PORT: ${process.env.PORT}`);
console.log(`[DEBUG] FRONTEND_URL: ${process.env.FRONTEND_URL}`);

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const systemRoutes = require('./routes/systemRoutes');
const queueRoutes = require('./routes/queueRoutes');

// Import controller queue untuk set Io instance
const queueController = require('./controllers/queueController');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000; // Menggunakan port dari .env, default 5000

// Konfigurasi CORS untuk Socket.IO
const io = new Server(server, {
    cors: {
        // Mengizinkan origin dari variabel lingkungan FRONTEND_URL
        // Jika FRONTEND_URL tidak diset, fallback ke 'https://skydance.life'
        origin: process.env.FRONTEND_URL || 'https://skydance.life', 
        methods: ['GET', 'POST'],
        credentials: true
    }
});
console.log(`[DEBUG] Socket.IO CORS Origin set to: ${process.env.FRONTEND_URL || 'https://skydance.life'}`);


// Set instance Socket.IO di controller
queueController.setIoInstance(io);
console.log('[DEBUG] Socket.IO instance set in queueController.');


// Middlewares
app.use(cors({
    // Mengizinkan origin dari variabel lingkungan FRONTEND_URL untuk permintaan HTTP
    origin: process.env.FRONTEND_URL || 'https://skydance.life', 
    credentials: true
}));
console.log(`[DEBUG] Express CORS Origin set to: ${process.env.FRONTEND_URL || 'https://skydance.life'}`);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
console.log('[DEBUG] bodyParser middlewares configured.');


// Basic route
app.get('/', (req, res) => {
    console.log('[INFO] Root path "/" accessed.');
    res.send('Welcome to Antrian PN Manokwari Backend API (Sequelize Edition)!');
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/queue', queueRoutes);
console.log('[DEBUG] All API routes configured.');


// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[ERROR] Global Error Handler caught an error:');
    console.error(err.stack);
    res.status(500).send('Something broke on the server!');
});

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
    console.log(`[SOCKET.IO] A user connected: ${socket.id} from origin: ${socket.handshake.headers.origin}`);
    socket.on('disconnect', () => {
        console.log('[SOCKET.IO] User disconnected:', socket.id);
    });
    socket.on('error', (error) => {
        console.error('[SOCKET.IO] Socket error:', error);
    });
    // Anda bisa menambahkan log untuk setiap event Socket.IO kustom di sini
    // Contoh:
    // socket.on('join_room', (roomId) => {
    //     console.log(`[SOCKET.IO] User ${socket.id} joined room ${roomId}`);
    // });
});
console.log('[DEBUG] Socket.IO connection handling configured.');


// --- Scheduler (Cron Job) untuk Reset Antrian Harian ---
const setupDailyResetCron = async () => {
    console.log('[DEBUG] Attempting to set up daily reset cron job...');
    try {
        // Pastikan model-model Sequelize telah diinisialisasi
        const { SystemSetting, Queue, Service } = db;

        if (!SystemSetting || !Queue || !Service) {
            console.error('CRON: Required models (SystemSetting, Queue, Service) not available yet for cron job setup. Retrying in 5 seconds...');
            setTimeout(setupDailyResetCron, 5000); // Coba lagi setelah 5 detik
            return;
        }
        console.log('[DEBUG] CRON: All required Sequelize models (SystemSetting, Queue, Service) are available.');

        let resetSetting = await SystemSetting.findOne({ where: { setting_key: 'daily_reset_time' } });
        let resetTime = resetSetting ? resetSetting.setting_value : '00:00'; // Default jika tidak ada di DB

        const [hour, minute] = resetTime.split(':');
        const cronSchedule = `${minute} ${hour} * * *`;

        console.log(`[CRON] Daily queue reset scheduled for ${resetTime} WIT with schedule: '${cronSchedule}'.`);

        cron.schedule(cronSchedule, async () => {
            console.log(`[CRON JOB] Running daily queue reset at ${new Date().toLocaleString()}`);
            try {
                const now = new Date();
                const formattedToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                console.log(`[CRON JOB] Updating queues with date less than ${formattedToday} to 'expired' status.`);
                await Queue.update(
                    { status: 'expired' },
                    {
                        where: {
                            queue_date: { [Op.lt]: formattedToday },
                            status: { [Op.in]: ['pending_otp', 'waiting', 'calling', 'on_hold', 'missed', 'recalled'] }
                        }
                    }
                );
                console.log('[CRON JOB] Previous day active queues marked as expired successfully.');

                if (queueController && queueController.emitQueueUpdate) {
                    console.log('[CRON JOB] Emitting global queue update...');
                    await queueController.emitQueueUpdate();
                } else {
                    console.warn('CRON: emitQueueUpdate not available in queueController for global update.');
                }

            } catch (error) {
                console.error('[CRON JOB] Error during daily queue reset:', error);
            }
        });
        
    } catch (error) {
        console.error('[CRON] Failed to setup daily reset cron job:', error);
    }
};


// Sinkronisasi database Sequelize dan memulai server
console.log('[DEBUG] Starting database synchronization...');
db.sequelize.sync({ alter: true }) // `alter: true` akan mencoba mengubah skema tabel tanpa menghapus data
  .then(() => {
    console.log('[INFO] Database synced successfully!');
    // Panggil setup cron job DI SINI setelah database siap
    setupDailyResetCron();

    server.listen(PORT, () => {
      console.log(`[INFO] Server is running on port ${PORT}`);
      console.log(`[INFO] Access API locally at http://localhost:${PORT}`);
      console.log(`[INFO] WebSocket server running locally at http://localhost:${PORT}`);
      console.log(`[INFO] For external access (via Nginx), use your domain (e.g., https://skydance.life)`);
    });
  })
  .catch(err => {
    console.error('[ERROR] Failed to sync database:', err);
    // Tambahkan log detail koneksi database untuk debugging lebih lanjut
    console.error(`[ERROR] DB Connection Details - Host: ${process.env.DB_HOST}, User: ${process.env.DB_USER}, Name: ${process.env.DB_NAME}`);
    process.exit(1); // Keluar dari proses jika koneksi DB gagal
  });
