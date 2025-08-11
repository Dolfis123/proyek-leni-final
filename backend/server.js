// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();

// Import database dari models/index.js (Sequelize)
const db = require("./models");
const { Op } = require("sequelize"); // Diperlukan untuk cron job update

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const systemRoutes = require("./routes/systemRoutes");
const queueRoutes = require("./routes/queueRoutes");

// Import controller queue untuk set Io instance
const queueController = require("./controllers/queueController");

const app = express();

// Mengaktifkan trust proxy agar Express mengenali bahwa ia berada di belakang Nginx.
app.enable("trust proxy");

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Konfigurasi CORS untuk Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Set instance Socket.IO di controller
queueController.setIoInstance(io);

// Middlewares
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "https://pengadilannegerimanokwari.pro",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic route
app.get("/api", (req, res) => {
  res.send("Welcome to Antrian PN Manokwari Backend API (Sequelize Edition)!");
});

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/queue", queueRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// --- Socket.IO Connection Handling ---
// Kode ini hanya menangani namespace default ('/')
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// --- Scheduler (Cron Job) untuk Reset Antrian Harian ---
const setupDailyResetCron = async () => {
  try {
    const SystemSetting = db.SystemSetting;
    const Queue = db.Queue;
    const Service = db.Service;

    if (!SystemSetting || !Queue || !Service) {
      console.error(
        "CRON: Required models (SystemSetting, Queue, Service) not available yet for cron job setup. Retrying in 5 seconds..."
      );
      setTimeout(setupDailyResetCron, 5000);
      return;
    }

    let resetSetting = await SystemSetting.findOne({
      where: { setting_key: "daily_reset_time" },
    });
    let resetTime = resetSetting ? resetSetting.setting_value : "00:00";

    const [hour, minute] = resetTime.split(":");
    const cronSchedule = `${minute} ${hour} * * *`;

    console.log(`Daily queue reset scheduled for ${resetTime} WIT.`);

    cron.schedule(cronSchedule, async () => {
      console.log(
        `[CRON JOB] Running daily queue reset at ${new Date().toLocaleString()}`
      );
      try {
        const now = new Date();
        const formattedToday = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        await Queue.update(
          { status: "expired" },
          {
            where: {
              queue_date: {
                [Op.lt]: formattedToday,
              },
              status: {
                [Op.in]: [
                  "pending_otp",
                  "waiting",
                  "calling",
                  "on_hold",
                  "missed",
                  "recalled",
                ],
              },
            },
          }
        );
        console.log("Previous day active queues marked as expired.");

        if (queueController && queueController.emitQueueUpdate) {
          await queueController.emitQueueUpdate();
        } else {
          console.warn(
            "CRON: emitQueueUpdate not available in queueController."
          );
        }
      } catch (error) {
        console.error("[CRON JOB] Error during daily queue reset:", error);
      }
    });
  } catch (error) {
    console.error("Failed to setup daily reset cron job:", error);
  }
};

// Sinkronisasi database Sequelize dan memulai server
db.sequelize
  .sync() // <-- AMAN
  .then(() => {
    console.log("Database synced successfully!");
    setupDailyResetCron();

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Access API at http://localhost:${PORT}`);
      console.log(`WebSocket server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
    process.exit(1);
  });
