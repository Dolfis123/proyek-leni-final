// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

// Import database dari models/index.js (Sequelize)
const db = require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const systemRoutes = require('./routes/systemRoutes');
const queueRoutes = require('./routes/queueRoutes'); // <<< BARU


// Import controller queue untuk set Io instance
const queueController = require('./controllers/queueController'); // Pastikan ini diimpor


const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Konfigurasi CORS untuk Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5174',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Set instance Socket.IO di controller
// PENTING: Panggil ini di sini agar 'io' tersedia di controller
queueController.setIoInstance(io);


// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5174',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
    res.send('Welcome to Antrian PN Manokwari Backend API (Sequelize Edition)!');
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/queue', queueRoutes); // <<< BARU


// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// --- Scheduler (Cron Job) untuk Reset Antrian Harian ---
// Sekarang kita bisa mengaktifkannya kembali dan mengadaptasinya untuk Sequelize
const setupDailyResetCron = async () => {
    try {
        const SystemSetting = db.SystemSetting;
        const Queue = db.Queue; // Ambil model Queue
        const Service = db.Service; // Ambil model Service (jika perlu emitServiceUpdate, dll)

        if (!SystemSetting || !Queue || !Service) { // Pastikan semua model yang dibutuhkan siap
            console.error('CRON: Required models (SystemSetting, Queue, Service) not available yet for cron job setup. Retrying in 5 seconds...');
            setTimeout(setupDailyResetCron, 5000); // Coba lagi setelah 5 detik
            return;
        }

        let resetSetting = await SystemSetting.findOne({ where: { setting_key: 'daily_reset_time' } });
        let resetTime = resetSetting ? resetSetting.setting_value : '00:00'; // Default jika tidak ada di DB

        const [hour, minute] = resetTime.split(':');
        const cronSchedule = `${minute} ${hour} * * *`; // Contoh: '0 0 * * *' untuk 00:00

        console.log(`Daily queue reset scheduled for ${resetTime} WIT.`);

        // Hentikan jadwal yang sudah ada jika ada untuk menghindari duplikasi
        // cron.getTasks().forEach(task => task.stop()); // Hanya jika ingin menghentikan semua task sebelumnya

        cron.schedule(cronSchedule, async () => {
            console.log(`[CRON JOB] Running daily queue reset at ${new Date().toLocaleString()}`);
            try {
                const now = new Date();
                const formattedToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                // Tandai semua antrian hari sebelumnya yang belum selesai sebagai 'expired'
                await Queue.update(
                    { status: 'expired' },
                    {
                        where: {
                            queue_date: { [Op.lt]: formattedToday }, // Kurang dari tanggal hari ini
                            status: { [Op.in]: ['pending_otp', 'waiting', 'calling', 'on_hold', 'missed', 'recalled'] }
                        }
                    }
                );
                console.log('Previous day active queues marked as expired.');

                // Emit update global setelah reset
                // Karena emitQueueUpdate memerlukan controller, pastikan controller sudah diimport dan io diset.
                // Jika ingin emit update global, kita perlu memanggilnya dari sini.
                // emitQueueUpdate(); // Ini akan dipanggil di server.js, bukan di controller
                // Untuk memanggil emitQueueUpdate dari sini, kita bisa memanggil fungsi di controller
                if (queueController && queueController.emitQueueUpdate) { // Panggil emitQueueUpdate dari controller
                    await queueController.emitQueueUpdate();
                } else {
                    console.warn('CRON: emitQueueUpdate not available in queueController.');
                }

            } catch (error) {
                console.error('[CRON JOB] Error during daily queue reset:', error);
            }
        });
        
    } catch (error) {
        console.error('Failed to setup daily reset cron job:', error);
    }
};


// Sinkronisasi database Sequelize dan memulai server
db.sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced successfully!');
    // Panggil setup cron job DI SINI setelah database siap
    setupDailyResetCron(); // <<< AKTIFKAN LAGI

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Access API at http://localhost:${PORT}`);
      console.log(`WebSocket server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
    process.exit(1);
  });