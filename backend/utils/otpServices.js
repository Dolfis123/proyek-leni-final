const otpGenerator = require('otp-generator');
const nodemailer = require(' ');
const twilio = require('twilio');
// const { OTPModel } = require('../models/OTP'); // Model untuk menyimpan OTP di DB (optional)

// Function untuk menghasilkan OTP
const generateOTP = () => {
  const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
  return otp;
};

// Fungsi untuk mengirim OTP via Email
const sendOTPViaEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Anda bisa mengganti ini dengan layanan email lain jika perlu
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject('Error sending OTP via email: ' + error);
      } else {
        resolve('OTP sent successfully');
      }
    });
  });
};

// Fungsi untuk mengirim OTP via WhatsApp (menggunakan Twilio API)
const sendOTPViaWhatsApp = async (whatsappNumber, otp) => {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

  const message = await client.messages.create({
    body: `Your OTP code is: ${otp}`,
    from: 'whatsapp:+14155238886', // Nomor WhatsApp Twilio (gunakan nomor Twilio yang Anda miliki)
    to: `whatsapp:${whatsappNumber}`,
  });

  return message.sid;
};

// Fungsi untuk mengirim OTP via SMS (menggunakan Twilio API)
const sendOTPViaSMS = async (phoneNumber, otp) => {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

  const message = await client.messages.create({
    body: `Your OTP code is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });

  return message.sid;
};

// Fungsi untuk menyimpan OTP ke database
const storeOTPInDB = async (otp, contactInfo, type) => {
  const otpEntry = new OTPModel({
    otpCode: otp,
    contactInfo,
    type, // Email, WhatsApp, SMS
    createdAt: Date.now(),
  });

  await otpEntry.save();
};

// Fungsi untuk mengirim OTP ke pengguna
const sendOTP = async (contactInfo, contactType) => {
  const otp = generateOTP();
  
  // Kirim OTP ke pengguna via metode yang dipilih
  if (contactType === 'email') {
    await sendOTPViaEmail(contactInfo, otp);
  } else if (contactType === 'whatsapp') {
    await sendOTPViaWhatsApp(contactInfo, otp);
  } else if (contactType === 'sms') {
    await sendOTPViaSMS(contactInfo, otp);
  }

  // Simpan OTP yang dikirim ke dalam database
  await storeOTPInDB(otp, contactInfo, contactType);
  return otp;
};

// Fungsi untuk memverifikasi OTP
const verifyOTP = async (otpCode, contactInfo) => {
  // Cari OTP di database berdasarkan contactInfo dan OTP code
  const otpEntry = await OTPModel.findOne({ contactInfo, otpCode });

  if (!otpEntry) {
    throw new Error('Invalid OTP');
  }

  // Periksa apakah OTP sudah kadaluwarsa (misalnya kadaluwarsa dalam 5 menit)
  const currentTime = Date.now();
  const otpCreatedAt = otpEntry.createdAt;

  if (currentTime - otpCreatedAt > 5 * 60 * 1000) {
    throw new Error('OTP has expired');
  }

  // OTP valid dan belum kadaluarsa
  return true;
};

module.exports = {
  sendOTP,
  verifyOTP,
};
