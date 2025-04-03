const express = require("express");
const { pool } = require("../db");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");
const authRouter = express.Router();
const axios = require("axios");
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1345978112101318737/9996QP4vSzuurX0X-qeTLwvrIOumPOOqzzg-a4l17Vy3JB_fIKwiwABU7TeoX826hTrU";

  authRouter.post("/sign-up", async (req, res, next) => {
    try {
      const { fullName, email, password, role } = req.body;
      const [existingUser] = await pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
  
     
      const [result] = await pool.query(
        `INSERT INTO users (fullName, email, password, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [fullName, email, hashedPassword, role]
      );
  
      const userId = result.insertId;
      const token = await generateToken({ userId, email });
  

      const [newUser] = await pool.query(
        "SELECT id, fullName, email, role, created_at, updated_at FROM users WHERE id = ?",
        [userId]
      );
  
      res.status(201).json({
        user: newUser[0],
        token,
      });
    } catch (error) {
      console.error("Database Error:", error);
      next(error);
    }
  });
  
authRouter.post("/sign-in", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [user] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (user.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const existingUser = user[0];
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const roles = Array.isArray(existingUser.roles)
      ? existingUser.roles
      : JSON.parse(existingUser.roles || "[]");

    const token = await generateToken({
      userId: existingUser.id,
      email: existingUser.email,
    });

    res.status(200).json({
      user: {
        id: existingUser.id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        roles,
        created_at: existingUser.created_at,
        updated_at: existingUser.updated_at,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    next(error);
  }
});

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    const [user] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (user.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }
    const resetToken = Math.floor(100000 + Math.random() * 900000);
    await pool.query("INSERT INTO otps (email, otp) VALUES (?, ?)", [
      email,
      resetToken,
    ]);
    await axios.post(DISCORD_WEBHOOK_URL, {
      content: `🔑 **Password Reset Token:** ${resetToken}\nUser email: ${email}`,
    });

    res.status(200).json({ message: "Reset token sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    next(error);
  }
});

authRouter.post("/verify-otp", async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const [result] = await pool.query(
      "SELECT * FROM otps WHERE email = ? AND otp = ?",
      [email, otp]
    );

    if (result.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    next(error);
  }
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    const [otpRecord] = await pool.query(
      "SELECT * FROM otps WHERE email = ? AND otp = ?",
      [email, otp]
    );
    if (otpRecord.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await pool.query("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);
    await pool.query("DELETE FROM otps WHERE email = ?", [email]);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    next(error);
  }
});

authRouter.put("/update-profile", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const [userRecord] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (userRecord.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    let hashedPassword;
    if (password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const query = `
      UPDATE users
      SET 
        name = IFNULL(?, name), 
        password = IFNULL(?, password)
      WHERE email = ?
    `;
    const params = [name, hashedPassword, email];
    await pool.query(query, params);

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update Profile Error:", error);
    next(error);
  }
});

module.exports = authRouter;
