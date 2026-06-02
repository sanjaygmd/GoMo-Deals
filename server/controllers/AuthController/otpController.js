import { pool } from "../../config/db.js";
import { generateOtp, hashOtp } from "../../utils/otp.js";
import { sendEmailOtp } from "../../utils/mailer.js";
import crypto from 'crypto';

export const sendOTP = async (req, res) => {
  try {
    const { email, purpose, user_type } = req.body;
    const type = user_type || 'customer';

    // Security Fix: Prefix purpose with user_type namespace to completely segregate OTP domains
    const scopedPurpose = `${type}_${purpose || 'registration'}`;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check existence based on purpose
    let existingUser;
    if (type === 'seller') {
      existingUser = await pool.query(`SELECT seller_id FROM sellers WHERE email = $1`, [email]);
    } else if (type === 'admin') {
      existingUser = await pool.query(`SELECT admin_id FROM admins WHERE email = $1`, [email]);
    } else if (type === 'super_admin') {
      existingUser = await pool.query(`SELECT super_admin_id FROM super_admins WHERE email = $1`, [email]);
    } else {
      existingUser = await pool.query(`SELECT customer_id FROM customers WHERE email = $1`, [email]);
    }

    if (purpose === 'registration' && existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    if ((purpose === 'login' || purpose === 'forgot_password') && existingUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const otp = generateOtp();
    const otp_hash = hashOtp(otp);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      `INSERT INTO otp_verifications (email, otp_hash, expires_at, purpose)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email, purpose) DO UPDATE 
       SET otp_hash = $2, expires_at = $3, is_verified = false, attempts = 0`,
      [email, otp_hash, expires_at, scopedPurpose]
    );

    await sendEmailOtp(email, otp, purpose);

    return res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("SEND OTP ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose, user_type } = req.body;
    const type = user_type || 'customer';

    const scopedPurpose = `${type}_${purpose || 'registration'}`;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const result = await pool.query(
      `SELECT * FROM otp_verifications 
       WHERE email = $1 AND purpose = $2`,
      [email, scopedPurpose]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "OTP not found or expired" });
    }

    const otpData = result.rows[0];

    if (otpData.is_verified) {
      return res.status(400).json({ success: false, message: "OTP already used" });
    }

    if (new Date() > otpData.expires_at) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (otpData.attempts >= 5) {
      return res.status(400).json({ success: false, message: "Too many failed attempts" });
    }

    const hashedInput = hashOtp(otp);
    const hashedInputBuf = Buffer.from(hashedInput, 'utf-8');
    const otpHashBuf = Buffer.from(otpData.otp_hash, 'utf-8');

    if (hashedInputBuf.length !== otpHashBuf.length || !crypto.timingSafeEqual(hashedInputBuf, otpHashBuf)) {
      await pool.query(
        "UPDATE otp_verifications SET attempts = attempts + 1 WHERE email = $1 AND purpose = $2",
        [email, scopedPurpose]
      );
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Mark as used
    await pool.query(
      "UPDATE otp_verifications SET is_verified = true WHERE email = $1 AND purpose = $2",
      [email, scopedPurpose]
    );

    return res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};

import bcrypt from 'bcryptjs';

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, user_type } = req.body;
    const type = user_type || 'customer';
    const scopedPurpose = `${type}_forgot_password`;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    // First verify the OTP manually here so we don't rely on frontend sequence alone
    const otpCheck = await pool.query(
      `SELECT * FROM otp_verifications WHERE email = $1 AND purpose = $2`,
      [email, scopedPurpose]
    );

    if (otpCheck.rows.length === 0 || new Date() > otpCheck.rows[0].expires_at) {
      return res.status(400).json({ success: false, message: "OTP expired or invalid" });
    }
    
    // We expect the OTP to have been marked 'is_verified' by verifyOTP step, but if not we can just verify it again
    if (!otpCheck.rows[0].is_verified) {
      const hashedInput = hashOtp(otp);
      const hashedInputBuf = Buffer.from(hashedInput, 'utf-8');
      const otpHashBuf = Buffer.from(otpCheck.rows[0].otp_hash, 'utf-8');
      
      if (hashedInputBuf.length !== otpHashBuf.length || !crypto.timingSafeEqual(hashedInputBuf, otpHashBuf)) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    let updateQuery = "";
    if (type === 'customer') {
      updateQuery = "UPDATE customers SET password_hash = $1 WHERE email = $2";
    } else if (type === 'seller') {
      updateQuery = "UPDATE sellers SET password_hash = $1 WHERE email = $2";
    } else if (type === 'admin') {
      updateQuery = "UPDATE admins SET password_hash = $1 WHERE email = $2";
    } else if (type === 'super_admin') {
      updateQuery = "UPDATE super_admins SET password_hash = $1 WHERE email = $2";
    }

    const result = await pool.query(updateQuery, [passwordHash, email]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Clean up OTP
    await pool.query("DELETE FROM otp_verifications WHERE email = $1 AND purpose = $2", [email, scopedPurpose]);

    return res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};
