// controllers/queueController.js

const db = require("../models");
const OtpCode = db.OtpCode;
const Queue = db.Queue;
const Service = db.Service;
const SystemSetting = db.SystemSetting;
const Holiday = db.Holiday;
const User = db.User;
const moment = require("moment-timezone");
const { Op } = require("sequelize");
require("dotenv").config();
const nodemailer = require("nodemailer");

// --- Konfigurasi Nodemailer (Gmail) ---
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gunakan Sandi Aplikasi Google
    },
});

// --- Instance Socket.IO (dari server.js) ---
let io;
const setIoInstance = (socketIoInstance) => {
    io = socketIoInstance;
};

// --- Helper Functions ---

// Kirim Email
const sendEmailNotification = async(toEmail, subject, htmlContent) => {
    const mailOptions = {
        from: `"Antrian PN Manokwari" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: subject,
        html: htmlContent,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${toEmail} using Gmail: ${subject}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${toEmail} with Nodemailer:`, error);
        return false;
    }
};

// Kirim WhatsApp (Placeholder)
const sendWhatsAppNotification = async(phoneNumber, message) => {
    console.log(`[WhatsApp Mock] Sending to ${phoneNumber}: ${message}`);
    return false; // Ganti dengan implementasi nyata jika ada
};

// Siapkan Data Antrian Publik (SUDAH DIPERBAIKI - Menggunakan WIT)
const preparePublicQueueData = async() => {
    // --- Gunakan Waktu WIT ---
    const WIT_NOW = moment().tz("Asia/Jayapura");
    const FORMATTED_TODAY = WIT_NOW.format("YYYY-MM-DD"); // Tanggal WIT hari ini

    try {
        const activeQueues = await Queue.findAll({
            where: {
                queue_date: FORMATTED_TODAY, // <-- Gunakan tanggal WIT
                status: {
                    [Op.in]: ["waiting", "calling", "on_hold"]
                },
            },
            include: [{ model: Service, as: "service" }],
            order: [
                ["queue_number_daily", "ASC"]
            ],
        });

        const services = await Service.findAll({ where: { is_active: true } });
        const publicStatus = [];

        for (const service of services) {
            const queuesForService = activeQueues.filter(q => q.service_id === service.id);
            const callingQueue = queuesForService.find(q => q.status === "calling");

            let callingNumber = "---";
            let waitingCount = 0;
            let estimatedWaitTime = "N/A"; // Default jika tidak ada data

            if (callingQueue) {
                callingNumber = callingQueue.full_queue_number;
                const callingQueueDailyNum = callingQueue.queue_number_daily;
                waitingCount = queuesForService.filter(
                    q => q.status === "waiting" && q.queue_number_daily > callingQueueDailyNum
                ).length;
            } else {
                // Jika tidak ada yang dipanggil, hitung semua yang menunggu
                waitingCount = queuesForService.filter(q => q.status === "waiting").length;
                const firstWaiting = queuesForService
                    .filter(q => q.status === "waiting")
                    .sort((a, b) => a.queue_number_daily - b.queue_number_daily)[0];
                callingNumber = firstWaiting ? firstWaiting.full_queue_number : "Kosong";
            }

            // Estimasi Waktu Tunggu hanya jika ada yang menunggu
            if (waitingCount > 0) {
                estimatedWaitTime = `${waitingCount * service.estimated_duration_minutes} min`;
            }


            publicStatus.push({
                id: service.id,
                service_name: service.service_name,
                service_prefix: service.service_prefix,
                calling_number: callingNumber,
                waiting_count: waitingCount,
                estimated_wait_time: estimatedWaitTime,
            });
        }

        return publicStatus.sort((a, b) => a.service_prefix.localeCompare(b.service_prefix));
    } catch (error) {
        console.error("Error preparing public queue data:", error);
        return []; // Kembalikan array kosong jika error
    }
};

// Emit Update via Socket.IO
const emitQueueUpdate = async(serviceId = null) => {
    if (!io) {
        console.warn("Socket.IO instance not set for queueController.");
        return;
    }
    try {
        const dataToEmit = await preparePublicQueueData();
        io.emit("queue_update", dataToEmit);
        console.log("[Socket.IO] Emitted queue_update to all clients.");
    } catch (error) {
        console.error("Error emitting queue update:", error);
    }
};

// --- Middleware Cek Operasional (Sudah Benar) ---
const checkOperationalStatus = async(req, res, next) => {
    try {
        const WIT_NOW = moment().tz("Asia/Jayapura");
        const FORMATTED_TODAY = WIT_NOW.format("YYYY-MM-DD");
        const currentHour = WIT_NOW.hour();
        const currentMinute = WIT_NOW.minute();

        // Cek Hari Libur
        const holiday = await Holiday.findOne({ where: { holiday_date: FORMATTED_TODAY } });
        if (holiday) {
            return res.status(403).json({ message: `Layanan tutup hari ini: ${holiday.holiday_name}` });
        }

        // Ambil Jam Operasional (Asumsi Senin, perlu penyesuaian untuk hari lain jika beda)
        const settingKeys = [
            "monday_open_time", "monday_close_time",
            "monday_break_start_time", "monday_break_end_time",
        ];
        const settings = await SystemSetting.findAll({
            where: {
                setting_key: {
                    [Op.in]: settingKeys
                }
            }
        });
        const getSettingValue = (key, defaultValue) => {
            const setting = settings.find(s => s.setting_key === key);
            return setting ? setting.setting_value : defaultValue;
        };

        const openTimeStr = getSettingValue("monday_open_time", "08:00");
        const closeTimeStr = getSettingValue("monday_close_time", "16:00");
        const breakStartTimeStr = getSettingValue("monday_break_start_time", "12:00");
        const breakEndTimeStr = getSettingValue("monday_break_end_time", "13:00");

        const parseTimeToMinutes = (timeStr) => {
            if (!timeStr || !timeStr.includes(':')) return 0; // Handle null or invalid format
            const [h, m] = timeStr.split(":").map(Number);
            return h * 60 + m;
        };

        let openMinutes = parseTimeToMinutes(openTimeStr);
        let closeMinutes = parseTimeToMinutes(closeTimeStr);
        let breakStartMinutes = parseTimeToMinutes(breakStartTimeStr);
        let breakEndMinutes = parseTimeToMinutes(breakEndTimeStr);
        let currentMinutes = currentHour * 60 + currentMinute;

        // Logika Penyesuaian Lintas Tengah Malam (jika perlu)
        if (closeMinutes < openMinutes) closeMinutes += 24 * 60;
        if (breakEndMinutes < breakStartMinutes) breakEndMinutes += 24 * 60;
        // Jika waktu saat ini lebih kecil dari waktu buka (misal jam 1 pagi), tambahkan 24 jam
        if (currentMinutes < openMinutes && closeMinutes > 24 * 60) currentMinutes += 24 * 60;


        // Cek Jam Buka/Tutup
        if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
            return res.status(403).json({ message: `Layanan tutup. Jam operasional: ${openTimeStr} - ${closeTimeStr} WIT.` });
        }


        // Cek Jam Istirahat
        if (currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
            // Izinkan request OTP dan verifikasi selama istirahat
            if (req.path.includes("/request-otp") || req.path.includes("/verify-otp-and-create")) {
                next();
            } else {
                return res.status(403).json({ message: `Layanan sedang istirahat (${breakStartTimeStr} - ${breakEndTimeStr} WIT).` });
            }
        } else {
            next(); // Lanjutkan jika tidak libur dan tidak istirahat
        }

    } catch (error) {
        console.error("Error in checkOperationalStatus middleware:", error);
        return res.status(500).json({ message: "Gagal memeriksa status operasional." });
    }
};

// --- API Endpoint Controllers ---

// 1. Meminta Kode OTP (PERBAIKAN TOTAL)
const requestOtp = async(req, res) => {
    const { service_id, customer_name, customer_email, customer_phone_number } = req.body;
    if (!service_id || !customer_name || !customer_email || !customer_phone_number) {
        return res.status(400).json({ message: "Semua kolom wajib diisi." });
    }

    try {
        const WIT_NOW = moment().tz("Asia/Jayapura");
        const FORMATTED_TODAY = WIT_NOW.format("YYYY-MM-DD");

        // Cek antrian aktif
        const existingActiveQueue = await Queue.findOne({
            where: {
                customer_email: customer_email,
                queue_date: FORMATTED_TODAY,
                status: {
                    [Op.notIn]: ["completed", "missed", "expired"]
                },
            },
        });
        if (existingActiveQueue) {
            return res.status(409).json({ message: "Anda sudah memiliki antrian aktif hari ini." });
        }

        const service = await Service.findByPk(service_id);
        if (!service || !service.is_active) {
            return res.status(404).json({ message: "Layanan tidak ditemukan atau tidak aktif." });
        }

        // Invalidasi OTP lama
        await OtpCode.update({ is_used: true, is_verified: false, expires_at: WIT_NOW.toDate() }, {
            where: {
                recipient_email: customer_email,
                is_used: false,
                expires_at: {
                    [Op.gt]: WIT_NOW.toDate()
                },
            },
        });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const emailSent = await sendEmailNotification(
            customer_email,
            "Kode Verifikasi Antrian PN Manokwari",
            `Halo ${customer_name}, <br><br>Kode verifikasi Anda adalah: <strong>${otpCode}</strong>. <br><br>Kode ini berlaku selama ${process.env.OTP_EXPIRES_MINUTES || 10} menit.<br><br>Terima kasih.`
        );

        if (emailSent) {
            await OtpCode.create({
                recipient_email: customer_email,
                otp_code: otpCode,
                expires_at: WIT_NOW.add(process.env.OTP_EXPIRES_MINUTES || 10, 'minutes').toDate(),
            });
            res.status(200).json({ message: "Kode OTP telah dikirim ke email Anda." });
        } else {
            res.status(500).json({ message: "Gagal mengirim kode OTP. Silakan coba lagi." });
        }
    } catch (error) {
        console.error("Error in requestOtp:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// 2. Verifikasi OTP dan Buat Antrian (PERBAIKAN TOTAL)
const verifyOtpAndCreateQueue = async(req, res) => {
    const { service_id, customer_name, customer_email, customer_phone_number, otp_code } = req.body;
    if (!service_id || !customer_name || !customer_email || !customer_phone_number || !otp_code) {
        return res.status(400).json({ message: "Semua kolom wajib diisi." });
    }

    try {
        const WIT_NOW = moment().tz("Asia/Jayapura");
        const FORMATTED_TODAY = WIT_NOW.format("YYYY-MM-DD");

        // Cek antrian aktif
        const existingQueue = await Queue.findOne({
            where: {
                customer_email: customer_email,
                queue_date: FORMATTED_TODAY,
                status: {
                    [Op.notIn]: ["missed", "expired", "completed"]
                },
            },
        });
        if (existingQueue) {
            return res.status(409).json({ message: "Anda sudah memiliki antrian aktif hari ini." });
        }

        // Validasi OTP
        const otpRecord = await OtpCode.findOne({
            where: {
                recipient_email: customer_email,
                otp_code: otp_code,
                expires_at: {
                    [Op.gt]: WIT_NOW.toDate()
                },
                is_used: false,
            },
        });
        if (!otpRecord) {
            return res.status(400).json({ message: "Kode OTP tidak valid atau telah kadaluarsa." });
        }
        await otpRecord.update({ is_used: true, is_verified: true });

        // Dapatkan nomor antrian berikutnya
        const lastQueue = await Queue.findOne({
            where: { service_id: service_id, queue_date: FORMATTED_TODAY },
            order: [
                ["queue_number_daily", "DESC"]
            ],
        });
        const nextQueueNumberDaily = lastQueue ? lastQueue.queue_number_daily + 1 : 1;

        const service = await Service.findByPk(service_id);
        if (!service) throw new Error("Service not found.");
        const fullQueueNumber = service.service_prefix + String(nextQueueNumberDaily).padStart(3, "0");

        // Buat Antrian Baru
        const newQueue = await Queue.create({
            service_id: service_id,
            queue_date: FORMATTED_TODAY, // <-- Tanggal WIT
            queue_number_daily: nextQueueNumberDaily,
            full_queue_number: fullQueueNumber,
            customer_name: customer_name,
            customer_email: customer_email,
            customer_phone_number: customer_phone_number,
            status: "waiting",
            otp_verified_at: WIT_NOW.toDate(), // <-- Waktu WIT
            registration_time: WIT_NOW.toDate(), // <-- Waktu WIT
        });

        // Kirim Notifikasi
        await sendEmailNotification(
            customer_email,
            "Konfirmasi Nomor Antrian PN Manokwari",
            `Terima kasih, ${customer_name}! <br><br>Nomor antrian Anda untuk layanan <strong>${service.service_name}</strong> adalah: <strong>${newQueue.full_queue_number}</strong>.<br><br>Pantau status di website kami.<br><br>Terima kasih.`
        );
        await sendWhatsAppNotification( /* ... */ ); // Placeholder

        emitQueueUpdate(service.id); // Update real-time
        res.status(201).json({
            message: "Antrian berhasil dibuat!",
            queue: {
                id: newQueue.id,
                full_queue_number: newQueue.full_queue_number,
                service_name: service.service_name,
                customer_email: newQueue.customer_email,
            },
        });

    } catch (error) {
        console.error("Error in verifyOtpAndCreateQueue:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// 3. Status Antrian Publik (PERBAIKAN TOTAL - panggil helper)
const getPublicQueueStatus = async(req, res) => {
    try {
        const publicStatusData = await preparePublicQueueData(); // Helper sudah diperbaiki
        res.status(200).json(publicStatusData);
    } catch (error) {
        console.error("Error getting public queue status:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// 4. Status Antrian Saya (PERBAIKAN TOTAL)
const getMyQueueStatus = async(req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email parameter is required." });

    try {
        const WIT_NOW = moment().tz("Asia/Jayapura");
        const FORMATTED_TODAY = WIT_NOW.format("YYYY-MM-DD");

        const myQueue = await Queue.findOne({
            where: {
                customer_email: email,
                queue_date: FORMATTED_TODAY, // <-- BENAR
                status: {
                    [Op.notIn]: ["expired", "completed"]
                },
            },
            include: [{ model: Service, as: "service" }],
        });

        if (!myQueue) {
            return res.status(404).json({ message: "Tidak ada antrian aktif untuk email ini hari ini." });
        }

        const currentCalling = await Queue.findOne({
            where: {
                service_id: myQueue.service_id,
                queue_date: FORMATTED_TODAY, // <-- BENAR
                status: "calling",
            },
            order: [
                ["queue_number_daily", "ASC"]
            ],
        });

        let position = 0;
        let estimatedTime = "N/A";
        const serviceDuration = myQueue.service ? myQueue.service.estimated_duration_minutes : 10; // Default 10 menit jika null

        if (myQueue.status === "waiting" || myQueue.status === "on_hold") {
            const myNum = myQueue.queue_number_daily;
            if (currentCalling) {
                const callingNum = currentCalling.queue_number_daily;
                if (myNum > callingNum) {
                    // Hitung antrian di depan (termasuk yang dipanggil)
                    position = await Queue.count({
                        where: {
                            service_id: myQueue.service_id,
                            queue_date: FORMATTED_TODAY,
                            status: {
                                [Op.in]: ["waiting", "calling", "on_hold"]
                            },
                            queue_number_daily: {
                                [Op.lt]: myNum
                            } // Yang nomornya LEBIH KECIL
                        }
                    });
                    // Kurangi yang sedang dipanggil jika ada
                    if (currentCalling) position++;
                } else { // Jika nomor saya = nomor dipanggil (misal on_hold dipanggil ulang)
                    position = 0;
                }
            } else {
                // Jika tidak ada yang dipanggil, hitung semua yang di depan
                position = await Queue.count({
                    where: {
                        service_id: myQueue.service_id,
                        queue_date: FORMATTED_TODAY,
                        status: {
                            [Op.in]: ["waiting", "on_hold"]
                        },
                        queue_number_daily: {
                            [Op.lt]: myNum
                        },
                    }
                });
            }
            estimatedTime = `${position * serviceDuration} min`;
            if (position == 0 && myQueue.status === "waiting") estimatedTime = "Segera";

        } else if (myQueue.status === "calling") {
            position = 0;
            estimatedTime = "Sekarang!";
        } else if (myQueue.status === "missed") {
            position = "Terlewat";
            estimatedTime = "Silakan Ambil Ulang Antrian";
        } else if (myQueue.status === "pending_otp") {
            return res.status(200).json({
                message: "Antrian belum aktif. Mohon selesaikan verifikasi OTP.",
                queue: myQueue.toJSON(), // Kirim data antrian sementara
                current_calling_number: currentCalling ? currentCalling.full_queue_number : "---",
                queues_in_front: "N/A",
                estimated_wait_time: "N/A"
            });
        }


        res.status(200).json({
            message: "Status antrian Anda:",
            queue: myQueue.toJSON(),
            current_calling_number: currentCalling ? currentCalling.full_queue_number : "---",
            queues_in_front: position,
            estimated_wait_time: estimatedTime,
        });

    } catch (error) {
        console.error("Error in getMyQueueStatus:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};


// 5. Ambil Ulang Antrian Terlewat (PERBAIKAN TOTAL)
const requeueMissed = async(req, res) => {
    const { customer_email, service_id } = req.body;
    if (!customer_email || !service_id) { /* ... error handling ... */ }

    try {
        const WIT_NOW = moment().tz("Asia/Jayapura");
        const FORMATTED_TODAY = WIT_NOW.format("YYYY-MM-DD");

        const missedQueue = await Queue.findOne({
            where: {
                customer_email: customer_email,
                queue_date: FORMATTED_TODAY, // <-- BENAR
                status: "missed",
                service_id: service_id,
            },
        });

        if (!missedQueue) {
            return res.status(404).json({ message: "Tidak ada antrian terlewat untuk email/layanan ini hari ini." });
        }

        // Tandai yang lama sebagai 'recalled' agar tidak bisa diambil ulang lagi
        await missedQueue.update({ status: "recalled" });

        // Buat antrian baru
        const lastQueue = await Queue.findOne({
            where: { service_id: service_id, queue_date: FORMATTED_TODAY },
            order: [
                ["queue_number_daily", "DESC"]
            ],
        });
        const nextQueueNumberDaily = lastQueue ? lastQueue.queue_number_daily + 1 : 1;

        const service = await Service.findByPk(service_id);
        if (!service) throw new Error("Service not found.");
        const fullQueueNumber = service.service_prefix + String(nextQueueNumberDaily).padStart(3, "0");

        const newQueue = await Queue.create({
            service_id: service_id,
            queue_date: FORMATTED_TODAY, // <-- BENAR
            queue_number_daily: nextQueueNumberDaily,
            full_queue_number: fullQueueNumber,
            customer_name: missedQueue.customer_name, // Ambil data dari antrian lama
            customer_email: missedQueue.customer_email,
            customer_phone_number: missedQueue.customer_phone_number,
            status: "waiting", // Langsung waiting
            otp_verified_at: WIT_NOW.toDate(), // <-- BENAR (Waktu ambil ulang)
            registration_time: WIT_NOW.toDate(), // <-- BENAR (Waktu ambil ulang)
            // Anda bisa tambahkan kolom 'requeued_from_queue_id' jika perlu tracking
        });

        // Kirim Notifikasi
        await sendEmailNotification( /* ... */ );
        await sendWhatsAppNotification( /* ... */ ); // Placeholder

        emitQueueUpdate(service_id);
        res.status(200).json({
            message: "Antrian berhasil diambil ulang!",
            new_queue_number: newQueue.full_queue_number,
            new_queue_id: newQueue.id,
        });

    } catch (error) {
        console.error("Error in requeueMissed:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// --- API Admin ---

// 6. Dapatkan Antrian untuk Admin (PERBAIKAN TOTAL)
const getQueuesForAdmin = async(req, res) => {
    const { serviceId } = req.params;
    if (!serviceId) return res.status(400).json({ message: "Service ID diperlukan." });

    try {
        const FORMATTED_TODAY = moment().tz("Asia/Jayapura").format("YYYY-MM-DD");
        const selectedServiceIdInt = parseInt(serviceId);

        const queuesForService = await Queue.findAll({
            where: {
                service_id: selectedServiceIdInt,
                queue_date: FORMATTED_TODAY, // <-- BENAR
                status: {
                    [Op.in]: ["waiting", "calling", "on_hold"]
                },
            },
            order: [
                ["queue_number_daily", "ASC"]
            ],
            include: [{ model: Service, as: "service" }],
        });

        const currentCalling = queuesForService.find(q => q.status === "calling");
        const waitingQueues = queuesForService.filter(q => q.status === "waiting" || q.status === "on_hold");

        res.status(200).json({
            currentCalling: currentCalling ? currentCalling.toJSON() : null,
            waitingQueues: waitingQueues.map(q => q.toJSON()),
        });
    } catch (error) {
        console.error("Error getting queues for admin:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// 7. Panggil Antrian Berikutnya (PERBAIKAN TOTAL)
const callNextQueue = async(req, res) => {
    const { serviceId } = req.params;
    const adminId = req.user.id; // Dari middleware auth
    if (!serviceId) return res.status(400).json({ message: "Service ID diperlukan." });

    try {
        const WIT_NOW = moment().tz("Asia/Jayapura");
        const FORMATTED_TODAY = WIT_NOW.format("YYYY-MM-DD");
        const selectedServiceIdInt = parseInt(serviceId);

        // 1. Selesaikan yang sedang dipanggil (jika ada)
        const existingCalling = await Queue.findOne({
            where: {
                service_id: selectedServiceIdInt,
                queue_date: FORMATTED_TODAY,
                status: "calling",
            },
        });
        if (existingCalling) {
            await existingCalling.update({
                status: "completed",
                completion_time: WIT_NOW.toDate(), // <-- BENAR
                completed_by_user_id: adminId,
            });
        }

        // 2. Cari antrian berikutnya yang 'waiting'
        const nextQueue = await Queue.findOne({
            where: {
                service_id: selectedServiceIdInt,
                queue_date: FORMATTED_TODAY,
                status: "waiting", // Hanya panggil yang waiting
            },
            order: [
                ["queue_number_daily", "ASC"]
            ],
            include: [{ model: Service, as: "service" }], // Include service untuk notifikasi
        });


        if (!nextQueue) {
            emitQueueUpdate(selectedServiceIdInt); // Update UI meski kosong
            return res.status(404).json({ message: "Tidak ada antrian menunggu." });
        }

        // 3. Tandai sebagai 'calling'
        await nextQueue.update({
            status: "calling",
            called_time: WIT_NOW.toDate(), // <-- BENAR
            called_by_user_id: adminId,
        });

        // 4. Kirim notifikasi 'Akan Dipanggil' ke beberapa antrian berikutnya
        const setting = await SystemSetting.findOne({ where: { setting_key: "notification_threshold" } });
        const notificationThreshold = parseInt(setting ? setting.setting_value : "3");

        if (notificationThreshold > 0) {
            const upcomingQueues = await Queue.findAll({
                where: {
                    service_id: selectedServiceIdInt,
                    queue_date: FORMATTED_TODAY,
                    status: "waiting",
                    queue_number_daily: {
                        [Op.gt]: nextQueue.queue_number_daily
                    }, // Nomor setelah yang baru dipanggil
                },
                order: [
                    ["queue_number_daily", "ASC"]
                ],
                limit: notificationThreshold,
                include: [{ model: Service, as: "service" }], // Butuh service name
            });

            for (const q of upcomingQueues) {
                await sendEmailNotification(q.customer_email, "Antrian Anda Segera Dipanggil!", `Halo ${q.customer_name}, Antrian ${q.full_queue_number} (${q.service.service_name}) akan SEGERA DIPANGGIL. Mohon bersiap.`);
                await sendWhatsAppNotification( /* ... */ ); // Placeholder
            }
        }


        // 5. Kirim notifikasi 'Sedang Dipanggil' ke antrian yang dipanggil
        await sendEmailNotification(nextQueue.customer_email, "Nomor Antrian Anda Dipanggil!", `Halo ${nextQueue.customer_name}, Nomor antrian ${nextQueue.full_queue_number} (${nextQueue.service.service_name}) sedang dipanggil. Silakan ke loket.`);
        await sendWhatsAppNotification( /* ... */ ); // Placeholder

        emitQueueUpdate(selectedServiceIdInt); // Update UI
        res.status(200).json({
            message: "Antrian berhasil dipanggil.",
            called_queue: nextQueue.toJSON(),
        });

    } catch (error) {
        console.error("Error calling next queue:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// 8. Tandai Status Antrian (PERBAIKAN TOTAL)
const markQueueStatus = async(req, res) => {
    const { queueId } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;
    const validStatuses = ["completed", "missed", "on_hold", "waiting"]; // Tambah waiting jika perlu cancel on_hold

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Status tidak valid." });
    }

    try {
        const WIT_NOW = moment().tz("Asia/Jayapura");

        const queue = await Queue.findByPk(queueId, { include: [{ model: Service, as: "service" }] });
        if (!queue) {
            return res.status(404).json({ message: "Antrian tidak ditemukan." });
        }

        const updateData = { status: status };
        if (status === "completed") {
            updateData.completion_time = WIT_NOW.toDate(); // <-- BENAR
            updateData.completed_by_user_id = adminId;
        } else if (status === "missed") {
            updateData.missed_time = WIT_NOW.toDate(); // <-- BENAR
            updateData.called_by_user_id = adminId; // Catat siapa yg mark missed
        } else if (status === "on_hold") {
            // Bisa tambahkan logika lain jika perlu saat on_hold
        } else if (status === "waiting") {
            // Reset timestamp jika kembali ke waiting dari on_hold? Opsional.
            // updateData.called_time = null; 
        }


        await queue.update(updateData);

        // Kirim notifikasi jika 'missed'
        if (status === "missed") {
            await sendEmailNotification(queue.customer_email, "Antrian Anda Terlewat", `Halo ${queue.customer_name}, Antrian ${queue.full_queue_number} (${queue.service.service_name}) telah terlewat. Gunakan fitur "Ambil Ulang Antrian" jika masih perlu.`);
            await sendWhatsAppNotification( /* ... */ ); // Placeholder
        }

        emitQueueUpdate(queue.service_id); // Update UI
        res.status(200).json({ message: `Antrian berhasil ditandai sebagai ${status}.` });

    } catch (error) {
        console.error("Error marking queue status:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// 9. Panggil Ulang Antrian Terakhir (PERBAIKAN TOTAL)
const recallLastCalledQueue = async(req, res) => {
    const { serviceId } = req.params;
    const adminId = req.user.id;
    if (!serviceId) return res.status(400).json({ message: "Service ID diperlukan." });

    try {
        const WIT_NOW = moment().tz("Asia/Jayapura"); // Waktu WIT saat ini
        const FORMATTED_TODAY = WIT_NOW.format("YYYY-MM-DD");
        const selectedServiceIdInt = parseInt(serviceId);

        // Cari antrian yang statusnya 'calling' untuk layanan ini hari ini
        const lastCalled = await Queue.findOne({
            where: {
                service_id: selectedServiceIdInt,
                queue_date: FORMATTED_TODAY, // <-- BENAR
                status: "calling",
            },
            order: [
                ["called_time", "DESC"]
            ], // Ambil yang paling baru dipanggil
            include: [{ model: Service, as: "service" }],
        });

        if (!lastCalled) {
            return res.status(404).json({ message: "Tidak ada antrian yang sedang dipanggil untuk dipanggil ulang." });
        }

        // Update waktu panggil ulang (opsional, tapi bagus untuk log)
        // dan pastikan status tetap 'calling'
        await lastCalled.update({
            called_time: WIT_NOW.toDate(), // <-- Update waktu panggil terakhir
            called_by_user_id: adminId
        });


        // Kirim Notifikasi Panggil Ulang
        await sendEmailNotification(lastCalled.customer_email, "Panggilan Antrian Ulang", `Halo ${lastCalled.customer_name}, Nomor antrian ${lastCalled.full_queue_number} (${lastCalled.service.service_name}) dipanggil ulang. Silakan ke loket.`);
        await sendWhatsAppNotification( /* ... */ ); // Placeholder

        // Tidak perlu emitQueueUpdate karena status tidak berubah, tapi bisa jika ingin refresh UI admin
        // emitQueueUpdate(selectedServiceIdInt);

        res.status(200).json({
            message: "Antrian berhasil dipanggil ulang.",
            recalled_queue: lastCalled.toJSON(),
        });

    } catch (error) {
        console.error("Error recalling last called queue:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// 10. Laporan Antrian (SUDAH BENAR - tidak menggunakan waktu saat ini)
const getQueueReport = async(req, res) => {
    const { startDate, endDate, serviceId } = req.query;
    if (!startDate || !endDate) { /* ... error handling ... */ }

    try {
        const whereClause = {
            // Kolom registration_time sudah DATE di DB, jadi BETWEEN harusnya aman
            registration_time: {
                [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`],
            },
        };
        if (serviceId) {
            whereClause.service_id = parseInt(serviceId);
        }

        const report = await Queue.findAll({
            where: whereClause,
            attributes: [
                // ... (Atribut agregasi Anda sudah benar) ...
                [db.sequelize.fn("DATE", db.sequelize.col("Queue.registration_time")), "date"],
                [db.sequelize.col("service.service_name"), "service_name"],
                [db.sequelize.fn("COUNT", db.sequelize.col("Queue.id")), "total_queues"],
                [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN Queue.status = 'completed' THEN 1 ELSE 0 END")), "completed_queues"],
                [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN Queue.status = 'missed' THEN 1 ELSE 0 END")), "missed_queues"],
                [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN Queue.status = 'on_hold' THEN 1 ELSE 0 END")), "on_hold_queues"],
                [db.sequelize.fn("AVG", db.sequelize.literal("TIMESTAMPDIFF(MINUTE, Queue.registration_time, Queue.called_time)")), "avg_waiting_time_minutes"],
                [db.sequelize.fn("AVG", db.sequelize.literal("TIMESTAMPDIFF(MINUTE, Queue.called_time, Queue.completion_time)")), "avg_service_time_minutes"],
            ],
            include: [{ model: Service, as: "service", attributes: [] }],
            group: [
                db.sequelize.fn("DATE", db.sequelize.col("Queue.registration_time")),
                "service.service_name",
            ],
            order: [
                [db.sequelize.fn("DATE", db.sequelize.col("Queue.registration_time")), "ASC"],
                ["service_name", "ASC"],
            ],
            raw: true, // Optional: Get plain JSON objects
        });
        res.status(200).json(report);
    } catch (error) {
        console.error("Error fetching queue report:", error);
        res.status(500).json({ message: "Internal server error fetching report." });
    }
};

// --- Exports ---
module.exports = {
    setIoInstance,
    checkOperationalStatus,
    requestOtp,
    verifyOtpAndCreateQueue,
    getPublicQueueStatus,
    getMyQueueStatus,
    requeueMissed,
    getQueuesForAdmin,
    callNextQueue,
    markQueueStatus,
    recallLastCalledQueue,
    getQueueReport,
    emitQueueUpdate, // Export jika dipanggil dari tempat lain
};