// controllers/queueController.js
const db = require('../models'); // Mengimpor semua model Sequelize
const OtpCode = db.OtpCode;
const Queue = db.Queue;
const Service = db.Service;
const SystemSetting = db.SystemSetting;
const Holiday = db.Holiday;
const User = db.User; // Diperlukan untuk include relasi atau validasi user admin

const { Op } = require('sequelize'); // Untuk operator Sequelize seperti Op.lt, Op.in
require('dotenv').config();

// Untuk mengirim email (Brevo)
const Brevo = require('@getbrevo/brevo');
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// Untuk real-time updates (akan diinisialisasi di server.js)
let io;
const setIoInstance = (socketIoInstance) => {
    io = socketIoInstance;
};

// Helper function untuk mengirim notifikasi Email
const sendEmailNotification = async(toEmail, subject, htmlContent) => {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
        email: process.env.BREVO_SENDER_EMAIL,
    };
    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`Email sent to ${toEmail} using Brevo: ${subject}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${toEmail} with Brevo:`, error.message);
        if (error.response && error.response.text) {
            console.error('Brevo API Response Status:', error.response.statusCode);
            console.error('Brevo API Response Body:', error.response.text);
        }
        return false;
    }
};

// Helper function untuk mengirim notifikasi WhatsApp (placeholder)
const sendWhatsAppNotification = async(phoneNumber, message) => {
    console.log(`[WhatsApp Mock] Sending to ${phoneNumber}: ${message}`);
    return false;
};


// --- Middleware Pengecekan Jam Operasional & Hari Libur ---
const checkOperationalStatus = async(req, res, next) => {
    const currentMoment = new Date();
    const currentHour = currentMoment.getHours();
    const currentMinute = currentMoment.getMinutes();

    // Cek Hari Libur
    const holiday = await Holiday.findOne({
        where: { holiday_date: currentMoment.toISOString().slice(0, 10) }
    });
    if (holiday) {
        return res.status(403).json({ message: `Layanan tutup hari ini: ${holiday.holiday_name}` });
    }

    // Ambil jam operasional dari settings
    const settingKeys = ['monday_open_time', 'monday_close_time', 'monday_break_start_time', 'monday_break_end_time'];
    const settings = await SystemSetting.findAll({
        where: { setting_key: {
                [Op.in]: settingKeys } }
    });
    const getSettingValue = (key, defaultValue) => {
        const setting = settings.find(s => s.setting_key === key);
        return setting ? setting.setting_value : defaultValue;
    };

    const openTimeStr = getSettingValue('monday_open_time', '08:00');
    const closeTimeStr = getSettingValue('monday_close_time', '16:00');
    const breakStartTimeStr = getSettingValue('monday_break_start_time', '12:00');
    const breakEndTimeStr = getSettingValue('monday_break_end_time', '13:00');

    const parseTimeToMinutes = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    let openMinutes = parseTimeToMinutes(openTimeStr);
    let closeMinutes = parseTimeToMinutes(closeTimeStr);
    let breakStartMinutes = parseTimeToMinutes(breakStartTimeStr);
    let breakEndMinutes = parseTimeToMinutes(breakEndTimeStr);

    let currentMinutes = currentHour * 60 + currentMinute;

    // Logika Penyesuaian untuk Waktu Lintas Tengah Malam
    if (closeMinutes < openMinutes) {
        closeMinutes += 24 * 60;
        if (currentMinutes < openMinutes) {
            currentMinutes += 24 * 60;
        }
    }

    if (breakEndMinutes < breakStartMinutes) {
        breakEndMinutes += 24 * 60;
        if (currentMinutes < breakStartMinutes && currentMinutes < openMinutes) {
            currentMinutes += 24 * 60;
        }
    }

    // Pengecekan Jam Operasional Utama
    if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
        return res.status(403).json({ message: `Layanan tutup. Jam operasional: ${openTimeStr} - ${closeTimeStr} WIT.` });
    }

    // Pengecekan Jam Istirahat
    if (currentMinutes >= breakStartMinutes && currentMinutes <= breakEndMinutes) {
        if (req.path.includes('/request-otp') || req.path.includes('/verify-otp-and-create')) {
            next();
        } else {
            return res.status(403).json({ message: `Layanan sedang istirahat. Akan dilanjutkan pukul ${breakEndTimeStr} WIT.` });
        }
    } else {
        next();
    }
};

// --- Fungsi Pembantu untuk Real-time Updates (preparePublicQueueData & emitQueueUpdate) ---
// Ini akan mengambil data dengan join menggunakan Sequelize
const preparePublicQueueData = async() => {
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const activeQueues = await Queue.findAll({
        where: {
            queue_date: formattedToday,
            status: {
                [Op.in]: ['waiting', 'calling', 'on_hold'] }
        },
        include: [{ model: Service, as: 'service' }], // Join dengan model Service
        order: [
            ['queue_number_daily', 'ASC']
        ]
    });

    const services = await Service.findAll({ where: { is_active: true } }); // Ambil semua layanan aktif
    const serviceMap = new Map(services.map(s => [s.id, s])); // Map Service by ID

    const publicStatus = [];

    // Iterasi setiap layanan untuk mengumpulkan data
    for (const service of services) {
        const queuesForService = activeQueues.filter(q => q.service_id === service.id);
        const callingQueue = queuesForService.find(q => q.status === 'calling');

        let callingNumber = '---';
        let waitingCount = 0;
        let estimatedWaitTime = 'N/A';

        if (callingQueue) {
            callingNumber = callingQueue.full_queue_number;
            const callingQueueDailyNum = parseInt(callingQueue.full_queue_number.replace(service.service_prefix, ''));
            waitingCount = queuesForService.filter(q =>
                q.status === 'waiting' && q.queue_number_daily > callingQueueDailyNum
            ).length;
            estimatedWaitTime = `${waitingCount * service.estimated_duration_minutes} min`;
        } else {
            waitingCount = queuesForService.filter(q => q.status === 'waiting').length;
            estimatedWaitTime = `${waitingCount * service.estimated_duration_minutes} min`;
            if (waitingCount > 0) {
                // Jika tidak ada yang calling, ambil nomor antrian pertama yang waiting
                callingNumber = queuesForService.filter(q => q.status === 'waiting')
                    .sort((a, b) => a.queue_number_daily - b.queue_number_daily)[0].full_queue_number;
            } else {
                callingNumber = 'Kosong';
            }
        }

        publicStatus.push({
            id: service.id,
            service_name: service.service_name,
            service_prefix: service.service_prefix,
            calling_number: callingNumber,
            waiting_count: waitingCount,
            estimated_wait_time: estimatedWaitTime,
            // queues: queuesForService.map(q => q.toJSON()) // Opsional: include raw queues
        });
    }

    return publicStatus.sort((a, b) => a.service_prefix.localeCompare(b.service_prefix));
};


const emitQueueUpdate = async(serviceId = null) => {
    if (!io) {
        console.warn('Socket.IO instance not set for queueController.');
        return;
    }

    const dataToEmit = await preparePublicQueueData();
    console.log('[Socket.IO] Data prepared for emitting:', JSON.stringify(dataToEmit, null, 2));

    io.emit('queue_update', dataToEmit);

    console.log('[Socket.IO] Emitted queue_update to all clients.');
};

// --- API Publik (Pengguna) ---

// 1. Meminta Kode OTP
const requestOtp = async(req, res) => {
    const { service_id, customer_name, customer_email, customer_phone_number } = req.body;

    if (!service_id || !customer_name || !customer_email || !customer_phone_number) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const service = await Service.findByPk(service_id);
        if (!service || !service.is_active) {
            return res.status(404).json({ message: 'Service not found or is inactive.' });
        }

        // Invalidasi OTP sebelumnya untuk email ini
        await OtpCode.update({ is_used: true, is_verified: false, expires_at: new Date() }, // Tandai sebagai used dan expired
            { where: { recipient_email: customer_email, is_used: false, expires_at: {
                        [Op.gt]: new Date() } } }
        );

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP

        const emailSent = await sendEmailNotification(
            customer_email,
            'Kode Verifikasi Antrian Pengadilan Negeri Manokwari',
            `Halo ${customer_name}, <br><br>Kode verifikasi Anda adalah: <strong>${otpCode}</strong>. <br><br>Kode ini berlaku selama ${process.env.OTP_EXPIRES_MINUTES || 5} menit. Jangan bagikan kode ini kepada siapapun.<br><br>Terima kasih.`
        );

        if (emailSent) {
            await OtpCode.create({
                recipient_email: customer_email,
                otp_code: otpCode,
                expires_at: new Date(new Date().getTime() + parseInt(process.env.OTP_EXPIRES_MINUTES || 5) * 60 * 1000)
            });
            res.status(200).json({ message: 'Kode OTP telah dikirim ke email Anda.' });
        } else {
            res.status(500).json({ message: 'Gagal mengirim kode OTP. Silakan coba lagi.' });
        }

    } catch (error) {
        console.error('Error in requestOtp (Sequelize):', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// controllers/queueController.js

// ... (imports lainnya dan fungsi-fungsi di atasnya) ...

// 2. Memverifikasi Kode OTP dan Membuat Antrian
const verifyOtpAndCreateQueue = async(req, res) => {
    const { service_id, customer_name, customer_email, customer_phone_number, otp_code } = req.body;

    if (!service_id || !customer_name || !customer_email || !customer_phone_number || !otp_code) {
        return res.status(400).json({ message: 'All fields and OTP are required.' });
    }

    try {
        const today = new Date();
        const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Cek apakah sudah ada antrian aktif untuk email ini hari ini
        const existingQueue = await Queue.findOne({
            where: {
                customer_email: customer_email,
                queue_date: formattedToday,
                status: {
                    [Op.notIn]: ['missed', 'expired', 'completed'] }
            }
        });

        if (existingQueue) {
            return res.status(409).json({ message: 'Anda sudah memiliki antrian aktif hari ini.' });
        }

        const otpRecord = await OtpCode.findOne({
            where: {
                recipient_email: customer_email,
                otp_code: otp_code,
                expires_at: {
                    [Op.gt]: new Date() },
                is_used: false
            }
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Kode OTP tidak valid atau telah kadaluarsa.' });
        }

        await otpRecord.update({ is_used: true, is_verified: true });

        // --- PERBAIKAN UTAMA DI SINI ---
        // Dapatkan nomor antrian harian berikutnya untuk layanan ini
        // Gunakan findAll (mengembalikan array) dan pastikan penanganan jika array kosong
        const existingQueuesForServiceToday = await Queue.findAll({
            where: {
                service_id: service_id,
                queue_date: formattedToday
            },
            order: [
                ['queue_number_daily', 'DESC']
            ],
            limit: 1
        });

        let nextQueueNumberDaily = 1;
        // Jika ada antrian sebelumnya, ambil nomor antrian harian terakhir + 1
        if (existingQueuesForServiceToday.length > 0) {
            nextQueueNumberDaily = existingQueuesForServiceToday[0].queue_number_daily + 1;
        }
        // --- AKHIR PERBAIKAN UTAMA ---

        // Dapatkan prefix layanan dan nama layanan
        const service = await Service.findByPk(service_id);
        if (!service) {
            throw new Error('Service not found.');
        }
        const fullQueueNumber = service.service_prefix + String(nextQueueNumberDaily).padStart(3, '0');

        // Buat antrian baru
        const newQueue = await Queue.create({
            service_id: service_id,
            queue_date: formattedToday,
            queue_number_daily: nextQueueNumberDaily,
            full_queue_number: fullQueueNumber,
            customer_name: customer_name,
            customer_email: customer_email,
            customer_phone_number: customer_phone_number,
            status: 'waiting',
            otp_verified_at: new Date()
        });

        // Notifikasi konfirmasi antrian via Email
        const confirmationEmailSent = await sendEmailNotification(
            customer_email,
            'Konfirmasi Nomor Antrian Pengadilan Negeri Manokwari',
            `Terima kasih, ${customer_name}! <br><br>Anda telah berhasil mendaftar antrian untuk layanan <strong>${service.service_name}</strong>. <br><br>Nomor antrian Anda adalah: <strong>${newQueue.full_queue_number}</strong>.<br><br>Harap pantau status antrian Anda melalui website kami.<br><br>Terima kasih.`
        );
        // Notifikasi konfirmasi antrian via WhatsApp (jika diimplementasikan)
        await sendWhatsAppNotification(
            customer_phone_number,
            `Terima kasih, ${customer_name}! Nomor antrian Anda untuk layanan ${service.service_name} adalah ${newQueue.full_queue_number}. Pantau status di website.`
        );

        emitQueueUpdate(service.id); // Emit update ke semua client
        res.status(201).json({
            message: 'Antrian berhasil dibuat!',
            queue: {
                id: newQueue.id,
                full_queue_number: newQueue.full_queue_number,
                service_name: service.service_name,
                customer_email: newQueue.customer_email
            }
        });

    } catch (error) {
        console.error('Error in verifyOtpAndCreateQueue (Sequelize):', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// ... (sisa kode controller) ...

// 3. Mendapatkan Status Antrian Publik (Real-time Display)
const getPublicQueueStatus = async(req, res) => {
    try {
        const publicStatusData = await preparePublicQueueData();
        res.status(200).json(publicStatusData);
    } catch (error) {
        console.error('Error getting public queue status (Sequelize):', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 4. Mendapatkan status antrian spesifik untuk pengguna (berdasarkan email)
const getMyQueueStatus = async(req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: 'Email parameter is required.' });
    }

    try {
        const today = new Date();
        const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const myQueue = await Queue.findOne({
            where: {
                customer_email: email,
                queue_date: formattedToday,
                status: {
                    [Op.notIn]: ['expired', 'completed'] } // Hanya cek yang belum expired/completed
            },
            include: [{ model: Service, as: 'service' }] // Join dengan Service untuk service_name
        });

        if (!myQueue) {
            return res.status(404).json({ message: 'No active queue found for this email today.' });
        }

        const currentCalling = await Queue.findOne({
            where: {
                service_id: myQueue.service_id,
                queue_date: formattedToday,
                status: 'calling'
            },
            order: [
                ['queue_number_daily', 'ASC']
            ]
        });

        let position = 0;
        let estimatedTime = 'N/A';

        if (myQueue.status === 'pending_otp') {
            return res.status(200).json({
                message: 'Antrian Anda belum aktif. Mohon selesaikan verifikasi OTP.',
                queue: myQueue,
                current_calling_number: currentCalling ? currentCalling.full_queue_number : 'Belum ada',
                queues_in_front: 'N/A', // Posisi belum relevan
                estimated_wait_time: 'N/A'
            });
        }

        if (myQueue.status === 'waiting' || myQueue.status === 'on_hold') {
            const myNum = myQueue.queue_number_daily; // Langsung ambil nomor harian
            const serviceDuration = myQueue.service ? myQueue.service.estimated_duration_minutes : 10;

            if (currentCalling) {
                const callingNum = currentCalling.queue_number_daily;

                if (myNum > callingNum) {
                    const queuesInFrontCount = await Queue.count({
                        where: {
                            service_id: myQueue.service_id,
                            queue_date: formattedToday,
                            status: {
                                [Op.in]: ['waiting', 'calling', 'on_hold'] },
                            queue_number_daily: {
                                [Op.gt]: callingNum, // Setelah yang sedang dipanggil
                                [Op.lt]: myNum // Sebelum antrian saya
                            }
                        }
                    });
                    position = queuesInFrontCount; // Jumlah antrian di depan + yang sedang dipanggil
                    // Sebenarnya, posisi adalah jumlah di depan yang menunggu + yang sedang dipanggil + yang on_hold di depan
                    // Simplifikasi: jumlah yang menunggu antara currentCalling dan saya + 1 (yang sedang dipanggil)
                    position = (await Queue.count({
                        where: {
                            service_id: myQueue.service_id,
                            queue_date: formattedToday,
                            status: {
                                [Op.in]: ['waiting', 'calling', 'on_hold'] },
                            queue_number_daily: {
                                [Op.lte]: myNum } // Semua antrian <= nomor saya
                        }
                    })) - 1; // Kurangi 1 karena saya sendiri dihitung

                    if (position < 0) position = 0; // Pastikan tidak negatif

                    estimatedTime = `${position * serviceDuration} min`;

                } else { // myNum <= callingNum, berarti saya sudah dipanggil atau di depan
                    position = 0;
                    estimatedTime = 'Segera';
                }

            } else { // Belum ada yang calling sama sekali, hitung dari awal
                const queuesInFrontCount = await Queue.count({
                    where: {
                        service_id: myQueue.service_id,
                        queue_date: formattedToday,
                        status: {
                            [Op.in]: ['waiting', 'on_hold'] }, // Hanya menunggu dan ditunda
                        queue_number_daily: {
                            [Op.lt]: myNum }
                    }
                });
                position = queuesInFrontCount;
                estimatedTime = `${position * serviceDuration} min`;
            }
        } else if (myQueue.status === 'calling') {
            position = 0;
            estimatedTime = 'Sekarang!';
        } else if (myQueue.status === 'missed') {
            position = 'Terlewat';
            estimatedTime = 'Silakan Ambil Ulang Antrian';
        }


        res.status(200).json({
            message: 'Status antrian Anda:',
            queue: myQueue, // myQueue sudah mengandung service.service_name karena include
            current_calling_number: currentCalling ? currentCalling.full_queue_number : 'Belum ada',
            queues_in_front: position,
            estimated_wait_time: estimatedTime
        });

    } catch (error) {
        console.error('Error in getMyQueueStatus (Sequelize):', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


// 5. Mengambil Ulang Antrian (untuk pengguna yang terlewat)
const requeueMissed = async(req, res) => {
    const { customer_email, service_id } = req.body;

    if (!customer_email || !service_id) {
        return res.status(400).json({ message: 'Customer email and service ID are required.' });
    }

    try {
        const today = new Date();
        const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Cari antrian yang terlewat untuk email ini
        const missedQueue = await Queue.findOne({ // Gunakan findOne
            where: {
                customer_email: customer_email,
                queue_date: formattedToday,
                status: 'missed',
                service_id: service_id // Pastikan layanan juga cocok
            }
        });

        if (!missedQueue) {
            return res.status(404).json({ message: 'No missed queue found for this email and service today.' });
        }

        // Tandai antrian lama sebagai 'recalled' agar tidak bisa di-requeue lagi
        await missedQueue.update({ status: 'recalled' });

        // Buat antrian baru dengan status 'waiting'
        const newQueue = await Queue.create({
            service_id: service_id,
            queue_date: formattedToday,
            customer_name: missedQueue.customer_name,
            customer_email: missedQueue.customer_email,
            customer_phone_number: missedQueue.customer_phone_number,
            status: 'waiting',
            otp_verified_at: new Date(),
            // Nomor antrian harian harus dihitung lagi untuk yang baru
            queue_number_daily: (await Queue.count({ where: { service_id: service_id, queue_date: formattedToday } })) + 1
        });
        // Dapatkan service detail untuk nama layanan
        const service = await Service.findByPk(service_id);
        if (!service) { throw new Error('Service not found for new queue.'); }
        newQueue.full_queue_number = service.service_prefix + String(newQueue.queue_number_daily).padStart(3, '0');
        await newQueue.save(); // Simpan full_queue_number yang baru

        // Notifikasi konfirmasi antrian ulang
        await sendEmailNotification(
            newQueue.customer_email,
            'Konfirmasi Antrian Ulang Pengadilan Negeri Manokwari',
            `Halo ${newQueue.customer_name}, <br><br>Anda telah mengambil ulang antrian. <br><br>Nomor antrian baru Anda adalah: <strong>${newQueue.full_queue_number}</strong>.<br><br>Harap pantau status antrian Anda melalui website kami.<br><br>Terima kasih.`
        );
        await sendWhatsAppNotification(
            newQueue.customer_phone_number,
            `Anda telah mengambil ulang antrian. Nomor antrian baru Anda untuk layanan ${service.service_name} adalah ${newQueue.full_queue_number}. Pantau status di website.`
        );

        emitQueueUpdate(service_id);
        res.status(200).json({
            message: 'Antrian berhasil diambil ulang!',
            new_queue_number: newQueue.full_queue_number,
            new_queue_id: newQueue.id
        });

    } catch (error) {
        console.error('Error in requeueMissed (Sequelize):', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


// --- API Admin (Staf Pengadilan) ---

// 1. Mendapatkan daftar antrian untuk loket admin
const getQueuesForAdmin = async(req, res) => {
    const { serviceId } = req.params; // serviceId dari URL params (string)
    const formattedToday = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

    console.log(`[Backend QM] Received request for serviceId: ${serviceId} on date: ${formattedToday}`);
    console.log(`[Backend QM] Type of serviceId (from params): ${typeof serviceId}`);

    try {
        const selectedServiceIdInt = parseInt(serviceId); // Pastikan ini integer

        // Dapatkan antrian aktif untuk layanan ini
        const queuesForService = await Queue.findAll({
            where: {
                service_id: selectedServiceIdInt, // Gunakan integer di sini
                queue_date: formattedToday,
                status: {
                    [Op.in]: ['waiting', 'calling', 'on_hold'] }
            },
            order: [
                ['queue_number_daily', 'ASC']
            ],
            include: [{ model: Service, as: 'service' }] // Sertakan detail layanan
        });

        const currentCalling = queuesForService.find(q => q.status === 'calling');
        const waitingQueues = queuesForService.filter(q => q.status === 'waiting' || q.status === 'on_hold');

        console.log(`[Backend QM] Queues for service ID ${serviceId} (total active):`, queuesForService.length);
        console.log(`[Backend QM] Filtered waiting/on_hold queues for service ID ${serviceId}:`, waitingQueues.length);

        res.status(200).json({
            currentCalling: currentCalling ? currentCalling.toJSON() : null, // Convert to JSON
            waitingQueues: waitingQueues.map(q => q.toJSON()) // Convert to JSON
        });

    } catch (error) {
        console.error('[Backend QM] Error getting queues for admin (Sequelize):', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 2. Memanggil antrian berikutnya
const callNextQueue = async(req, res) => {
    const { serviceId } = req.params;
    const adminId = req.user.id;

    console.log(`[Backend QM] Call Next for serviceId: ${serviceId} by admin: ${adminId}`);

    try {
        const formattedToday = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
        const selectedServiceIdInt = parseInt(serviceId);

        // Cari antrian yang sedang dipanggil untuk layanan ini
        const existingCalling = await Queue.findOne({
            where: {
                service_id: selectedServiceIdInt,
                queue_date: formattedToday,
                status: 'calling'
            }
        });

        if (existingCalling) {
            await existingCalling.update({ status: 'completed', completion_time: new Date(), completed_by_user_id: adminId });
            console.log(`[Backend QM] Previous calling queue ${existingCalling.full_queue_number} marked completed.`);
        }

        // Cari antrian waiting berikutnya
        const nextQueue = await Queue.findOne({
            where: {
                service_id: selectedServiceIdInt,
                queue_date: formattedToday,
                status: 'waiting'
            },
            order: [
                ['queue_number_daily', 'ASC']
            ]
        });

        if (!nextQueue) {
            emitQueueUpdate(selectedServiceIdInt);
            return res.status(404).json({ message: 'Tidak ada antrian yang menunggu untuk layanan ini.' });
        }

        await nextQueue.update({ status: 'calling', called_time: new Date(), called_by_user_id: adminId });
        console.log(`[Backend QM] Calling next queue: ${nextQueue.full_queue_number}`);

        const notificationThreshold = parseInt(await SystemSetting.findOne({ where: { setting_key: 'notification_threshold' } }) ? .setting_value || '3');
        const currentCallingQueueNumber = nextQueue.queue_number_daily; // Langsung ambil nomor harian

        const upcomingQueues = await Queue.findAll({
            where: {
                service_id: selectedServiceIdInt,
                queue_date: formattedToday,
                status: 'waiting',
                queue_number_daily: {
                    [Op.gt]: currentCallingQueueNumber }, // Setelah yang sedang dipanggil
            },
            order: [
                ['queue_number_daily', 'ASC']
            ],
            limit: notificationThreshold,
            include: [{ model: Service, as: 'service' }] // Join untuk service_name
        });

        for (const q of upcomingQueues) {
            await sendEmailNotification(
                q.customer_email,
                'Antrian Anda Segera Dipanggil!',
                `Halo ${q.customer_name}, <br><br>Antrian Anda (${q.full_queue_number}) untuk layanan ${q.service.service_name} akan SEGERA DIPANGGIL. Mohon bersiap menuju loket.<br><br>Terima kasih.`
            );
            await sendWhatsAppNotification(
                q.customer_phone_number,
                `Antrian Anda (${q.full_queue_number}) untuk layanan ${q.service.service_name} akan SEGERA DIPANGGIL. Mohon bersiap.`
            );
        }

        const calledService = await Service.findByPk(selectedServiceIdInt); // Dapatkan nama layanan untuk email panggilan utama
        await sendEmailNotification(
            nextQueue.customer_email,
            'Nomor Antrian Anda Dipanggil!',
            `Halo ${nextQueue.customer_name}, <br><br>Nomor antrian Anda (${nextQueue.full_queue_number}) untuk layanan ${calledService.service_name} sedang dipanggil. Silakan menuju loket sekarang.<br><br>Terima kasih.`
        );
        await sendWhatsAppNotification(
            nextQueue.customer_phone_number,
            `Nomor antrian Anda (${nextQueue.full_queue_number}) untuk layanan ${calledService.service_name} sedang dipanggil. Silakan menuju loket.`
        );


        emitQueueUpdate(selectedServiceIdInt);
        res.status(200).json({ message: 'Antrian berhasil dipanggil.', called_queue: nextQueue });

    } catch (error) {
        console.error('[Backend QM] Error calling next queue (Sequelize):', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 3. Menandai antrian (Selesai, Terlewat, Ditunda)
const markQueueStatus = async(req, res) => {
    const { queueId } = req.params;
    const { status } = req.body; // 'completed', 'missed', 'on_hold'
    const adminId = req.user.id; // User dari JWT

    console.log(`[Backend QM] Marking queue ${queueId} as ${status} by admin: ${adminId}`);

    if (!['completed', 'missed', 'on_hold'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const queue = await Queue.findByPk(queueId, {
            include: [{ model: Service, as: 'service' }] // Include service for email notif
        });
        if (!queue) {
            return res.status(404).json({ message: 'Antrian tidak ditemukan.' });
        }

        const updateData = { status: status };
        if (status === 'completed') {
            updateData.completion_time = new Date();
            updateData.completed_by_user_id = adminId;
        } else if (status === 'missed') {
            updateData.missed_time = new Date();
        }
        // Jika on_hold, tidak ada timestamp khusus

        await queue.update(updateData);

        // Jika status 'missed', kirim notifikasi khusus
        if (status === 'missed') {
            await sendEmailNotification(
                queue.customer_email,
                'Antrian Anda Terlewat di Pengadilan Negeri Manokwari',
                `Halo ${queue.customer_name}, <br><br>Nomor antrian Anda (${queue.full_queue_number}) untuk layanan ${queue.service.service_name} telah terlewat karena Anda tidak hadir saat dipanggil. <br><br>Jika Anda masih ingin dilayani, silakan kembali ke website dan gunakan fitur "Ambil Ulang Antrian" untuk mendapatkan nomor antrian baru.<br><br>Terima kasih.`
            );
            await sendWhatsAppNotification(
                queue.customer_phone_number,
                `Antrian Anda (${queue.full_queue_number}) untuk layanan ${queue.service.service_name} telah terlewat. Jika masih ingin dilayani, silakan kunjungi website untuk "Ambil Ulang Antrian".`
            );
        }

        emitQueueUpdate(queue.service_id);
        res.status(200).json({ message: `Antrian berhasil ditandai sebagai ${status}.` });

    } catch (error) {
        console.error('[Backend QM] Error marking queue status (Sequelize):', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 4. Memanggil Ulang Antrian Terakhir (jika admin tidak sengaja melewatkan/salah panggil)
const recallLastCalledQueue = async(req, res) => {
    const { serviceId } = req.params;
    const adminId = req.user.id;

    console.log(`[Backend QM] Recalling last queue for serviceId: ${serviceId} by admin: ${adminId}`);

    try {
        const formattedToday = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
        const selectedServiceIdInt = parseInt(serviceId);

        // Cari antrian yang statusnya 'calling' untuk service ini
        const lastCalled = await Queue.findOne({
            where: {
                service_id: selectedServiceIdInt,
                queue_date: formattedToday,
                status: 'calling'
            },
            order: [
                ['called_time', 'DESC']
            ], // Ambil yang paling baru dipanggil
            include: [{ model: Service, as: 'service' }] // Join untuk nama layanan
        });

        if (!lastCalled) {
            return res.status(404).json({ message: 'Tidak ada antrian yang sedang dipanggil untuk dipanggil ulang.' });
        }

        // Tandai sebagai 'calling' lagi
        await lastCalled.update({ status: 'calling', called_by_user_id: adminId }); // Update called_by_user_id juga

        await sendEmailNotification(
            lastCalled.customer_email,
            'Panggilan Antrian Ulang di Pengadilan Negeri Manokwari',
            `Halo ${lastCalled.customer_name}, <br><br>Nomor antrian Anda (${lastCalled.full_queue_number}) untuk layanan ${lastCalled.service.service_name} dipanggil ulang. Silakan menuju loket sekarang.<br><br>Terima kasih.`
        );
        await sendWhatsAppNotification(
            lastCalled.customer_phone_number,
            `Antrian Anda (${lastCalled.full_queue_number}) untuk layanan ${lastCalled.service.service_name} dipanggil ulang. Silakan menuju loket.`
        );

        emitQueueUpdate(selectedServiceIdInt);
        res.status(200).json({ message: 'Antrian berhasil dipanggil ulang.', recalled_queue: lastCalled });

    } catch (error) {
        console.error('[Backend QM] Error recalling last called queue (Sequelize):', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


// --- API Laporan (Super Admin) ---
const getQueueReport = async(req, res) => {
    const { startDate, endDate, serviceId } = req.query; // Ambil dari query params

    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required for reports.' });
    }

    try {
        const whereClause = {
            registration_time: {
                [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`] }
        };
        if (serviceId) {
            whereClause.service_id = parseInt(serviceId);
        }

        const report = await Queue.findAll({
            where: whereClause,
            attributes: [
                [db.sequelize.fn('DATE', db.sequelize.col('Queue.registration_time')), 'date'], // Group by date
                [db.sequelize.col('service.service_name'), 'service_name'], // Join to get service name
                [db.sequelize.fn('COUNT', db.sequelize.col('Queue.id')), 'total_queues'],
                [db.sequelize.fn('SUM', db.sequelize.literal("CASE WHEN Queue.status = 'completed' THEN 1 ELSE 0 END")), 'completed_queues'],
                [db.sequelize.fn('SUM', db.sequelize.literal("CASE WHEN Queue.status = 'missed' THEN 1 ELSE 0 END")), 'missed_queues'],
                [db.sequelize.fn('SUM', db.sequelize.literal("CASE WHEN Queue.status = 'on_hold' THEN 1 ELSE 0 END")), 'on_hold_queues'],
                [db.sequelize.fn('AVG', db.sequelize.literal("TIMESTAMPDIFF(MINUTE, Queue.registration_time, Queue.called_time)")), 'avg_waiting_time_minutes'],
                [db.sequelize.fn('AVG', db.sequelize.literal("TIMESTAMPDIFF(MINUTE, Queue.called_time, Queue.completion_time)")), 'avg_service_time_minutes']
            ],
            include: [{
                model: Service,
                as: 'service',
                attributes: [] // Don't select service attributes directly, only for grouping/joining
            }],
            group: [db.sequelize.fn('DATE', db.sequelize.col('Queue.registration_time')), 'service.service_name'], // Group by date and service name
            order: [
                [db.sequelize.fn('DATE', db.sequelize.col('Queue.registration_time')), 'ASC'],
                ['service_name', 'ASC']
            ]
        });
        res.status(200).json(report);
    } catch (error) {
        console.error('Error fetching queue report (Sequelize):', error);
        res.status(500).json({ message: 'Internal server error fetching report.' });
    }
};


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
    getQueueReport
};