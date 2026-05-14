const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const usernameRegex = /^[a-z0-9_]{3,20}$/;
const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const cleanEmail = (email = "") => email.toLowerCase().trim();
const cleanUsername = (username = "") => username.toLowerCase().trim().replace(/^@/, "");

const sendResetEmail = async ({ to, resetUrl }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email service is not configured. Add EMAIL_USER and EMAIL_PASS in backend .env");
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `Vybeo <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your Vybeo password",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Reset your password</h2>
        <p>You requested a password reset for your Vybeo account.</p>
        <p>This link will expire in 15 minutes.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#ec4899;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none">Reset Password</a>
        <p>If the button does not work, copy this link:</p>
        <p>${resetUrl}</p>
      </div>
    `,
  });
};

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = cleanEmail(req.body.email);
    const username = cleanUsername(req.body.username);
    const password = req.body.password || "";

    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message: "Username must be 3-20 characters. Use lowercase letters, numbers, or underscore only.",
      });
    }

    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include alphabet, number, and special character.",
      });
    }

    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        message: userExists.email === email ? "Email already exists" : "Username already taken",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN USER WITH USERNAME + PASSWORD
const loginUser = async (req, res) => {
  try {
    const username = cleanUsername(req.body.username || req.body.email);
    const password = req.body.password || "";

    if (!username || !password) {
      return res.status(400).json({ message: "Please enter username and password" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: "Please enter your registered email" });
    }

    const user = await User.findOne({ email });

    // Security: same response even if email does not exist
    if (!user) {
      return res.json({ message: "If this email exists, password reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/?resetToken=${resetToken}`;

    await sendResetEmail({ to: user.email, resetUrl });

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Reset token missing" });
    }

    if (!strongPasswordRegex.test(password || "")) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include alphabet, number, and special character.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful. You can login now." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};
