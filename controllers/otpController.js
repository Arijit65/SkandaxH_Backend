const nodemailer = require("nodemailer");
const crypto = require("crypto");
const db = require("../models");
const { User, Otp } = db;
const bcrypt = require("bcryptjs");

exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    // Save OTP in DB
    await Otp.create({ email, otp: otpCode, expiresAt });

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Skandax Hire" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP is <b>${otpCode}</b>. It expires in 10 minutes.</p>`,
    });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
  
    try {
      const record = await Otp.findOne({ where: { email, otp } });
  
      if (!record) return res.status(400).json({ error: "Invalid OTP" });
      if (new Date() > record.expiresAt) {
        return res.status(400).json({ error: "OTP expired" });
      }
  
      res.status(200).json({ message: "OTP verified" });
    } catch (err) {
      res.status(500).json({ error: "Verification failed" });
    }
  };


exports.updatePassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.status(200).json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: "Could not update password" });
  }
};
