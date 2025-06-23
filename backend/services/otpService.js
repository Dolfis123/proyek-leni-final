require('dotenv').config();
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Konfigurasi transporter email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.APP_EMAIL,  // Email pengirim
    pass: process.env.APP_PASSWORD,  // App Password dari Google
  },
});

// Kirim OTP via Email
async function sendOtpEmail(email, otpCode) {
  const mailOptions = {
    from: process.env.APP_EMAIL,  // Email pengirim
    to: email,  // Email penerima
    subject: 'Kode OTP Pendaftaran Perkara',
    text: `Kode OTP Anda adalah: ${otpCode}`,  // Konten email
  };

  try {
    // Kirim email
    await transporter.sendMail(mailOptions);
    console.log(`OTP berhasil dikirim ke email: ${email}`);
  } catch (error) {
    console.error('Error mengirim OTP via email:', error);
  }
}

// Kirim OTP via WhatsApp
async function sendOtpWhatsapp(phone, otpCode) {
  console.log(`Simulasi mengirim OTP ${otpCode} ke WhatsApp: ${phone}`);
  try {
    // Inisialisasi Twilio client dengan SID dan Auth Token
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

    // Pastikan nomor WhatsApp diformat dengan benar (misalnya +62 untuk Indonesia)
    const formattedPhone = `whatsapp:+62${phone.slice(1)}`;  // Format nomor WhatsApp Indonesia (menghapus '0' di depan)

    // Kirim pesan WhatsApp
    const message = await client.messages.create({
      body: `Kode OTP Anda: ${otpCode}`,
      from: 'whatsapp:+14155238886',  // Nomor WhatsApp Twilio (default sandbox)
      to: formattedPhone,  // Nomor tujuan dalam format internasional
    });

    console.log('OTP berhasil dikirim ke WhatsApp:', message.sid);
  } catch (error) {
    console.error('Gagal mengirim OTP ke WhatsApp:', error);
    // Log lebih lanjut untuk debugging
    if (error.response) {
      console.error('Error response:', error.response);
    }
  }
}

module.exports = {
  sendOtpEmail,
  sendOtpWhatsapp,
};
