// import { pool } from "../../configs/db.js";
import { pool } from '../../config/db.js';
import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';



import { createAuthSession, invalidateSession, cookieConfig, getCookieName, setSessionCookie } from "../../utils/authSession.js";
import { logAudit } from "../../utils/auditLogger.js";
import { processAutoPayout } from "../PayoutController.js";
import { pushOrderToShiprocket, createShiprocketReturn } from "../ShipmentController.js";
import { sendOrderStatusNotifications } from "../../utils/notifications.js";
import { sendAdminPasswordResetEmail, sendSuperAdminLoginOTP, sendAdminRegisterOTP as sendAdminRegisterOTPEmail } from "../../utils/mailer.js";
import { isPasswordStrong } from "../../utils/validation.js";
import { generateOtp, hashOtp } from "../../utils/otp.js";
import bcrypt from 'bcryptjs';

// const superAdminLoginOtps = new Map(); // MOVED TO DATABASE
// const resetOtps = new Map(); // MOVED TO DATABASE

const ALLOWED_TYPES = ['admin', 'super_admin'];


/**
 * Initial Setup: Create the first Super Admin
 * Only works if NO super admins exist in the database.
 */
export const setupAdmin = async (req, res) => {
  try {
    const { name, email, password, masterKey } = req.body;

    if (!name || !email || !password || !masterKey) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    if (!isPasswordStrong(password)) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
    }

    // 1. Initial Setup Check: Are there any super admins?
    // First check the explicit flag
    const setupCheckRes = await pool.query(`SELECT value FROM app_config WHERE key = 'admin_setup_done'`);
    if (setupCheckRes.rows.length > 0 && setupCheckRes.rows[0].value === true) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Initial setup is already complete. Please use standard registration via a Super Admin."
      });
    }

    const superAdminCountRes = await pool.query(`SELECT COUNT(*) FROM super_admins`);
    const isInitialSetup = parseInt(superAdminCountRes.rows[0].count) === 0;

    if (!isInitialSetup) {
      // Heal the flag if it was missing but admins exist
      await pool.query(`INSERT INTO app_config (key, value) VALUES ('admin_setup_done', 'true'::jsonb) ON CONFLICT (key) DO NOTHING`);
      return res.status(403).json({
        success: false,
        message: "Forbidden: Initial setup is already complete. Please use standard registration via a Super Admin."
      });
    }

    // 2. Validate Master Key against Environment using timing-safe comparisons
    const EXPECTED_MASTER_KEY = process.env.MASTER_SECURITY_KEY;
    if (!EXPECTED_MASTER_KEY || !masterKey) {
      return res.status(403).json({
        success: false,
        message: "Critical: Initial Super Admin setup requires a valid Master Security Key."
      });
    }

    const masterKeyBuf = Buffer.from(masterKey, 'utf-8');
    const expectedKeyBuf = Buffer.from(EXPECTED_MASTER_KEY, 'utf-8');

    if (masterKeyBuf.length !== expectedKeyBuf.length || !crypto.timingSafeEqual(masterKeyBuf, expectedKeyBuf)) {
      return res.status(403).json({
        success: false,
        message: "Critical: Initial Super Admin setup requires a valid Master Security Key."
      });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const existing = await pool.query(`SELECT 1 FROM super_admins WHERE email = $1`, [sanitizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: `Email already registered` });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const masterKeyHash = await bcrypt.hash(masterKey, 12);

    const result = await pool.query(
      `INSERT INTO super_admins 
       (super_admin_id, name, email, password_hash, role, is_active, created_at, updated_at, master_key) 
       VALUES 
       (gen_random_uuid(), $1, $2, $3, 'super_admin', true, NOW(), NOW(), $4)
       RETURNING super_admin_id as id, name, email, role`,
      [name, sanitizedEmail, passwordHash, masterKeyHash]
    );

    const user = result.rows[0];
    const ip = req.ip || '0.0.0.0';
    const device = { agent: req.get('User-Agent') };
    const session = await createAuthSession(user.id, 'super_admin', ip, device, { name: user.name, email: user.email });

    await logAudit({
      admin_id: user.id,
      action: 'INITIAL_SETUP_COMPLETE',
      table_name: 'super_admins',
      record_id: user.id,
      req,
      is_super_admin: true
    });

    // Mark setup as completed in the database flag
    await pool.query(`INSERT INTO app_config (key, value) VALUES ('admin_setup_done', 'true'::jsonb) ON CONFLICT (key) DO UPDATE SET value = 'true'::jsonb, updated_at = NOW()`);

    setSessionCookie(res, 'super_admin', session.token);

    return res.status(201).json({
      success: true,
      message: "First Super Admin account initialized successfully. Initial setup complete.",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sessionId: session.sessionId
      }
    });

  } catch (error) {
    console.error("SETUP ADMIN ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to initialize setup" });
  }
};

/**
 * Send OTP for Admin / Super Admin Registration (Step 1)
 * Validates form fields and sends a verification OTP before account is created.
 */
export const sendAdminRegisterOTP = async (req, res) => {
  try {
    const { name, email, password, type, masterKey } = req.body;
    const accountType = type || 'admin';

    if (!name || !email || !password || !masterKey) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!isPasswordStrong(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character."
      });
    }

    const ALLOWED_TYPES = ['admin', 'super_admin'];
    if (!ALLOWED_TYPES.includes(accountType)) {
      return res.status(400).json({ success: false, message: "Invalid account type" });
    }

    // Validate Master Key
    const EXPECTED_MASTER_KEY = process.env.MASTER_SECURITY_KEY;
    if (!EXPECTED_MASTER_KEY) {
      return res.status(500).json({ success: false, message: "Server configuration error" });
    }
    const masterKeyBuf = Buffer.from(masterKey, 'utf-8');
    const expectedKeyBuf = Buffer.from(EXPECTED_MASTER_KEY, 'utf-8');
    if (masterKeyBuf.length !== expectedKeyBuf.length || !crypto.timingSafeEqual(masterKeyBuf, expectedKeyBuf)) {
      return res.status(403).json({ success: false, message: "Invalid Master Security Key" });
    }

    // Check if email is already registered
    const sanitizedEmail = email.toLowerCase().trim();
    const adminExists = await pool.query(`SELECT 1 FROM admins WHERE email = $1`, [sanitizedEmail]);
    const saExists = await pool.query(`SELECT 1 FROM super_admins WHERE email = $1`, [sanitizedEmail]);
    if (adminExists.rows.length > 0 || saExists.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    // Generate and store OTP
    const otp = generateOtp();
    const otp_hash = hashOtp(otp);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      `INSERT INTO otp_verifications (email, otp_hash, expires_at, purpose)
       VALUES ($1, $2, $3, 'admin_registration')
       ON CONFLICT (email, purpose) DO UPDATE
       SET otp_hash = $2, expires_at = $3, is_verified = false, attempts = 0`,
      [sanitizedEmail, otp_hash, expires_at]
    );

    // Send OTP email
    await sendAdminRegisterOTPEmail(sanitizedEmail, name, otp, accountType);

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${sanitizedEmail}. Valid for 10 minutes.`
    });

  } catch (error) {
    console.error("SEND ADMIN REGISTER OTP ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to send verification code" });
  }
};

/**
 * Standard Admin Registration (Requires Super Admin Auth + OTP Verification)
 */
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, type, role, masterKey, otp } = req.body;
    const accountType = type || role || 'admin';

    if (!name || !email || !password || !masterKey) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP verification code is required" });
    }

    if (!isPasswordStrong(password)) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
    }

    // Verify OTP before proceeding
    const sanitizedEmailForOtp = email.toLowerCase().trim();
    const otpRecord = await pool.query(
      `SELECT * FROM otp_verifications WHERE email = $1 AND purpose = 'admin_registration'`,
      [sanitizedEmailForOtp]
    );

    if (otpRecord.rows.length === 0) {
      return res.status(400).json({ success: false, message: "No verification code found. Please request a new one." });
    }

    const otpData = otpRecord.rows[0];

    if (otpData.is_verified) {
      return res.status(400).json({ success: false, message: "Verification code already used. Please request a new one." });
    }

    if (new Date() > otpData.expires_at) {
      return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new one." });
    }

    if (otpData.attempts >= 5) {
      return res.status(400).json({ success: false, message: "Too many failed attempts. Please request a new code." });
    }

    const hashedInput = hashOtp(otp);
    const hashedInputBuf = Buffer.from(hashedInput, 'hex');
    const dbHashBuf = Buffer.from(otpData.otp_hash, 'hex');
    
    if (hashedInputBuf.length !== dbHashBuf.length || !crypto.timingSafeEqual(hashedInputBuf, dbHashBuf)) {
      await pool.query(
        `UPDATE otp_verifications SET attempts = attempts + 1 WHERE email = $1 AND purpose = 'admin_registration'`,
        [sanitizedEmailForOtp]
      );
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    // Mark OTP as used
    await pool.query(
      `UPDATE otp_verifications SET is_verified = true WHERE email = $1 AND purpose = 'admin_registration'`,
      [sanitizedEmailForOtp]
    );

    // Role Validation
    const ALLOWED_TYPES = ['admin', 'super_admin'];
    if (!ALLOWED_TYPES.includes(accountType)) {
      return res.status(400).json({ success: false, message: "Invalid account type" });
    }

    // Check if there are any super admins in the system
    const superAdminCountRes = await pool.query(`SELECT COUNT(*) FROM super_admins`);
    const isInitialSetup = parseInt(superAdminCountRes.rows[0].count) === 0;

    // MUST be authenticated as a super_admin unless it's the initial setup
    if (!isInitialSetup && (!req.user || req.user.type !== 'super_admin')) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Administrator registration is restricted to existing Super Admins."
      });
    }

    // Validate Master Key against Environment using timing-safe comparisons
    const EXPECTED_MASTER_KEY = process.env.MASTER_SECURITY_KEY;
    if (!EXPECTED_MASTER_KEY) {
      return res.status(500).json({
        success: false,
        message: "Critical: Server environment MASTER_SECURITY_KEY is not configured."
      });
    }

    const masterKeyBuf = Buffer.from(masterKey, 'utf-8');
    const expectedKeyBuf = Buffer.from(EXPECTED_MASTER_KEY, 'utf-8');

    if (masterKeyBuf.length !== expectedKeyBuf.length || !crypto.timingSafeEqual(masterKeyBuf, expectedKeyBuf)) {
      return res.status(403).json({
        success: false,
        message: "Critical: Registration requires a valid Admin Secret Key."
      });
    }

    const table = accountType === 'super_admin' ? 'super_admins' : 'admins';
    const sanitizedEmail = email.toLowerCase().trim();
    let existing;
    if (accountType === 'super_admin') {
      existing = await pool.query(`SELECT 1 FROM super_admins WHERE email = $1`, [sanitizedEmail]);
    } else {
      existing = await pool.query(`SELECT 1 FROM admins WHERE email = $1`, [sanitizedEmail]);
    }
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: `Email already registered as ${accountType}` });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let result;
    if (accountType === 'super_admin') {
      // New Super Admins inherit the hashed master key from the ENV for consistency
      const currentMasterKeyHash = await bcrypt.hash(EXPECTED_MASTER_KEY, 12);
      
      result = await pool.query(
        `INSERT INTO super_admins 
         (super_admin_id, name, email, password_hash, role, is_active, created_at, updated_at, master_key) 
         VALUES 
         (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW(), $5)
         RETURNING super_admin_id as id, name, email, role`,
        [name, sanitizedEmail, passwordHash, accountType, currentMasterKeyHash]
      );
    } else {
      result = await pool.query(
        `INSERT INTO admins 
         (admin_id, name, email, password_hash, role, is_active, created_at, updated_at) 
         VALUES 
         (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
         RETURNING admin_id as id, name, email, role`,
        [name, sanitizedEmail, passwordHash, accountType]
      );
    }

    const user = result.rows[0];
    const creatorId = req.user ? req.user.id : user.id;

    await logAudit({
      admin_id: creatorId,
      action: 'ADMIN_REGISTER',
      table_name: table,
      record_id: user.id,
      req,
      is_super_admin: accountType === 'super_admin' || (req.user && req.user.type === 'super_admin'),
      new_values: { registered_id: user.id, registered_email: user.email, role: accountType }
    });

    return res.status(201).json({
      success: true,
      message: `${accountType} account created successfully`,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("ADMIN REGISTER ERROR:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const loginAdmin = async (req, res) => {
  try {
    const { email, password, type, role } = req.body;
    const accountType = type || role || 'admin';


    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (!ALLOWED_TYPES.includes(accountType)) {
      return res.status(400).json({ success: false, message: "Invalid account type" });
    }

    const table = accountType === 'super_admin' ? 'super_admins' : 'admins';
    const idCol = accountType === 'super_admin' ? 'super_admin_id' : 'admin_id';

    const sanitizedEmail = email.toLowerCase().trim();
    let result;
    if (accountType === 'super_admin') {
      result = await pool.query(`SELECT * FROM super_admins WHERE email = $1`, [sanitizedEmail]);
    } else {
      result = await pool.query(`SELECT * FROM admins WHERE email = $1`, [sanitizedEmail]);
    }
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = result.rows[0];
    const userId = user[idCol];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "Account is deactivated. Contact platform owner." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const { otp } = req.body;
    const scopedPurpose = 'admin_login_2fa';

    if (!otp) {
      // Step 1: Password is correct, no OTP provided. Generate and send OTP.
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash("sha256").update(generatedOtp).digest("hex");
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await pool.query(
        `INSERT INTO otp_verifications (email, otp_hash, expires_at, purpose)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email, purpose) DO UPDATE 
         SET otp_hash = $2, expires_at = $3, is_verified = false, attempts = 0`,
        [user.email, otpHash, expiresAt, scopedPurpose]
      );

      await import('../../utils/mailer.js').then(m => m.sendEmailOtp(user.email, generatedOtp, 'login_2fa'));

      return res.status(200).json({
        success: true,
        requiresOtp: true, // Same format as customer/seller
        requires2FA: true, // Keeping this for backward compatibility with older admin frontend
        message: 'OTP sent to your email. Please verify to continue.'
      });
    }

    // Step 2: OTP provided. Verify it.
    const otpResult = await pool.query(
      `SELECT * FROM otp_verifications WHERE email = $1 AND purpose = $2`,
      [email, scopedPurpose]
    );

    if (otpResult.rows.length === 0 || new Date() > otpResult.rows[0].expires_at) {
      return res.status(400).json({ success: false, message: "OTP expired or invalid" });
    }

    const otpData = otpResult.rows[0];
    if (otpData.is_verified) {
      return res.status(400).json({ success: false, message: "OTP already used" });
    }
    if (otpData.attempts >= 5) {
      return res.status(400).json({ success: false, message: "Too many failed attempts" });
    }

    const hashedInput = crypto.createHash("sha256").update(otp).digest("hex");
    const hashedInputBuf = Buffer.from(hashedInput, 'hex');
    const otpHashBuf = Buffer.from(otpData.otp_hash, 'hex');

    if (hashedInputBuf.length !== otpHashBuf.length || !crypto.timingSafeEqual(hashedInputBuf, otpHashBuf)) {
      await pool.query(
        "UPDATE otp_verifications SET attempts = attempts + 1 WHERE email = $1 AND purpose = $2",
        [email, scopedPurpose]
      );
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP is valid. Clean it up.
    await pool.query("DELETE FROM otp_verifications WHERE email = $1 AND purpose = $2", [email, scopedPurpose]);

    try {
      if (accountType === 'super_admin') {
        await pool.query(`UPDATE super_admins SET last_login_at = NOW() WHERE super_admin_id = $1`, [userId]);
      } else {
        await pool.query(`UPDATE admins SET last_login_at = NOW() WHERE admin_id = $1`, [userId]);
      }
    } catch (dbErr) {
      console.error("Failed to update last_login_at in loginAdmin:", dbErr);
    }

    const ip = req.ip || req.socket.remoteAddress;
    const device = { agent: req.get('User-Agent') };
    const session = await createAuthSession(userId, accountType, ip, device, { name: user.name, email: user.email });

    // Log the successful login
    await logAudit({
      admin_id: userId,
      action: 'LOGIN',
      table_name: table,
      record_id: userId,
      req,
      is_super_admin: accountType === 'super_admin'
    });

    setSessionCookie(res, accountType, session.token);

    return res.status(200).json({
      success: true,
      message: `${accountType} login successful`,
      data: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        sessionId: session.sessionId
      }
    });

  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return res.status(500).json({ success: false, message: "Internal server error during login" });
  }
};



export const logoutAdmin = async (req, res) => {
  try {
    const sessionId = req.sessionId;
    if (sessionId) {
      await invalidateSession(sessionId);
    }
    res.clearCookie('token', { path: '/', httpOnly: true });
    res.clearCookie('admin_token', { path: '/', httpOnly: true });
    res.clearCookie('seller_token', { path: '/', httpOnly: true });
    res.clearCookie('customer_token', { path: '/', httpOnly: true });
    res.clearCookie('super_admin_token', { path: '/', httpOnly: true });
    return res.status(200).json({ success: true, message: "Admin logged out" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
};


/**
 * Update Admin / Super Admin Profile
 */
export const updateAdminProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Ownership check — only the admin themselves can update their profile
    if (req.user.id !== id) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const { name, email, phone, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const type = req.user.type;
    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(403).json({ success: false, message: "Invalid account type" });
    }

    const table = type === 'super_admin' ? 'super_admins' : 'admins';
    const idCol = type === 'super_admin' ? 'super_admin_id' : 'admin_id';

    await pool.query(
      `UPDATE ${table} SET name = $1, email = $2, updated_at = NOW() WHERE ${idCol} = $3`,
      [name, email, id]
    );

    const updatedUser = await pool.query(
      `SELECT ${idCol} as id, name, email, role FROM ${table} WHERE ${idCol} = $1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: { ...updatedUser.rows[0], role: req.user.type }
    });
  } catch (error) {
    console.error("UPDATE ADMIN PROFILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};


/**
 * Request Password Reset (Admin)
 * This creates a notification for Super Admins
 */
export const requestAdminPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    let accountInfo = null;
    let table = 'admins';
    let idCol = 'admin_id';

    const adminCheck = await pool.query("SELECT admin_id, name FROM admins WHERE email = $1", [email]);
    if (adminCheck.rows.length > 0) {
      accountInfo = adminCheck.rows[0];
    } else {
      const saCheck = await pool.query("SELECT super_admin_id, name FROM super_admins WHERE email = $1", [email]);
      if (saCheck.rows.length > 0) {
        accountInfo = saCheck.rows[0];
        table = 'super_admins';
        idCol = 'super_admin_id';
      }
    }

    if (!accountInfo) {
      // Security Fix: Prevent email enumeration by returning a generic success message
      return res.json({ success: true, message: "If an account exists with this email, a password reset link has been sent." });
    }

    // Generate a 6-digit numeric OTP
    const resetOtp = generateOtp();
    const otpHash = await bcrypt.hash(resetOtp, 10);
    const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await pool.query(
      `INSERT INTO otp_verifications (email, otp_hash, expires_at, purpose)
       VALUES ($1, $2, $3, 'admin_password_reset')
       ON CONFLICT (email, purpose) DO UPDATE 
       SET otp_hash = $2, expires_at = $3, is_verified = false, attempts = 0`,
      [email, otpHash, expires_at]
    );

    // Send email with reset OTP
    await sendAdminPasswordResetEmail(email, accountInfo.name, resetOtp);

    res.json({ success: true, message: "A password reset code has been sent to your registered email." });
  } catch (error) {
    console.error("PWD RESET REQUEST ERROR:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Verify OTP and Set New Password
 */
export const verifyAdminPasswordReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
    }

    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
    }


    const result = await pool.query(
      "SELECT * FROM otp_verifications WHERE email = $1 AND purpose = 'admin_password_reset'",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Reset token not found" });
    }

    const otpData = result.rows[0];

    if (otpData.is_verified) {
      return res.status(400).json({ success: false, message: "Reset link already used" });
    }

    if (new Date() > otpData.expires_at) {
      return res.status(400).json({ success: false, message: "Reset link has expired" });
    }

    if (otpData.attempts >= 5) {
      return res.status(400).json({ success: false, message: "Too many failed attempts. Please request a new reset link." });
    }

    // Verify using bcrypt compare (numeric OTP is hashed with bcrypt)
    const isOtpValid = await bcrypt.compare(otp, otpData.otp_hash);
    if (!isOtpValid) {
      await pool.query(
        "UPDATE otp_verifications SET attempts = attempts + 1 WHERE email = $1 AND purpose = 'admin_password_reset'",
        [email]
      );
      return res.status(400).json({ success: false, message: "Invalid or expired reset link" });
    }

    // Token is valid. We need the target account ID and table.
    // We can infer this from the email since email is unique across admins/super_admins (enforced by app logic)
    let target = null;
    let targetTable = 'admins';
    let targetIdCol = 'admin_id';

    const adminCheck = await pool.query("SELECT admin_id FROM admins WHERE email = $1", [email]);
    if (adminCheck.rows.length > 0) {
      target = adminCheck.rows[0];
    } else {
      const saCheck = await pool.query("SELECT super_admin_id FROM super_admins WHERE email = $1", [email]);
      if (saCheck.rows.length > 0) {
        target = saCheck.rows[0];
        targetTable = 'super_admins';
        targetIdCol = 'super_admin_id';
      }
    }

    if (!target) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // Update the password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      `UPDATE ${targetTable} SET password_hash = $1, updated_at = NOW() WHERE ${targetIdCol} = $2`,
      [passwordHash, target[targetIdCol]]
    );

    // Security: Invalidate all existing sessions for this admin
    await pool.query(
      "DELETE FROM auth_sessions WHERE user_ref_id = $1",
      [target[targetIdCol]]
    );

    // Mark as used
    await pool.query(
      "UPDATE otp_verifications SET is_verified = true WHERE email = $1 AND purpose = 'admin_password_reset'",
      [email]
    );

    res.json({ success: true, message: "Password has been successfully reset" });
  } catch (error) {
    console.error("VERIFY PWD RESET ERROR:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


/**
 * Get Admin Dashboard Stats and Charts
 */
export const getAdminDashboardData = async (req, res) => {
  try {
    // 1. Core Stats
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE is_deleted = false) as total_orders,
        (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL) as total_products,
        (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL) as total_customers,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE order_status != 'Cancelled' AND is_deleted = false) as total_revenue,
        (SELECT COUNT(*) FROM orders WHERE placed_at >= CURRENT_DATE AND is_deleted = false) as today_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE placed_at >= CURRENT_DATE AND order_status != 'Cancelled' AND is_deleted = false) as today_revenue,
        (SELECT COUNT(*) FROM products WHERE created_at >= CURRENT_DATE AND deleted_at IS NULL) as today_new_products,
        (SELECT COUNT(*) FROM customers WHERE created_at >= CURRENT_DATE AND deleted_at IS NULL) as today_new_customers
    `;
    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];


    // 2. Revenue Trend (Last 6 Months)
    const trendQuery = `
      SELECT 
        TO_CHAR(m.month, 'Mon') as month,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COALESCE((SELECT SUM(o2.platform_fee) FROM orders o2 WHERE date_trunc('month', o2.placed_at) = m.month AND (o2.payment_status = 'Paid' OR o2.order_status = 'Delivered') AND o2.order_status != 'Cancelled' AND o2.is_deleted = false), 0) +
        COALESCE((SELECT SUM(os2.seller_platform_fee) FROM order_sellers os2 JOIN orders o2 ON os2.order_id = o2.order_id WHERE date_trunc('month', o2.placed_at) = m.month AND (o2.payment_status = 'Paid' OR o2.order_status = 'Delivered') AND o2.order_status != 'Cancelled' AND o2.is_deleted = false), 0) as profit,
        COUNT(o.order_id) as orders
      FROM (
        SELECT date_trunc('month', CURRENT_DATE) - (i || ' month')::interval as month
        FROM generate_series(0, 5) i
      ) m
      LEFT JOIN orders o ON date_trunc('month', o.placed_at) = m.month AND o.order_status != 'Cancelled' AND o.is_deleted = false
      GROUP BY m.month
      ORDER BY m.month ASC
    `;
    const trendResult = await pool.query(trendQuery);

    // 3. Category (Room) Distribution
    const categoryQuery = `
      SELECT COALESCE(room, 'Other') as name, COUNT(*) as value
      FROM products
      WHERE deleted_at IS NULL
      GROUP BY room
      ORDER BY value DESC
      LIMIT 5
    `;
    const categoryResult = await pool.query(categoryQuery);

    // 4. Recent Orders
    const ordersQuery = `
      SELECT o.order_id as id, c.full_name as customer, o.total_amount as total, o.order_status as status, 
             TO_CHAR(o.placed_at, 'DD Mon, HH:MI AM') as time,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as items
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      WHERE o.is_deleted = false
      ORDER BY o.placed_at DESC
      LIMIT 5
    `;
    const ordersResult = await pool.query(ordersQuery);

    // 5. Recent Activity (Audit Logs)
    const activityQuery = `
      SELECT 
        CASE 
          WHEN action = 'LOGIN' THEN 'Admin logged in'
          WHEN action = 'CREATE' THEN 'New ' || table_name || ' record created'
          WHEN action = 'UPDATE' THEN table_name || ' record updated'
          WHEN action = 'DELETE' THEN table_name || ' record removed'
          ELSE action || ' on ' || table_name
        END as text,
        TO_CHAR(created_at, 'HH:MI AM') as time,
        action as type
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const activityResult = await pool.query(activityQuery);

    // 6. Product Performance
    const performanceQuery = `
      SELECT name, price, stock_quantity as stock, rating, reviews_count as "reviewCount", product_id as id, sku, room, images[1] as image
      FROM products
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const performanceResult = await pool.query(performanceQuery);

    const dashboardData = {
      stats: {
        total_orders: Number(stats.total_orders),
        total_products: Number(stats.total_products),
        total_customers: Number(stats.total_customers),
        total_revenue: Number(stats.total_revenue),
        today_orders: Number(stats.today_orders),
        today_revenue: Number(stats.today_revenue),
        today_new_products: Number(stats.today_new_products),
        today_new_customers: Number(stats.today_new_customers)
      },
      revenueTrend: trendResult.rows.map(r => ({
        ...r,
        revenue: Number(r.revenue),
        profit: Number(r.profit),
        orders: Number(r.orders)
      })),
      categoryDistribution: categoryResult.rows.map(r => ({
        ...r,
        value: Number(r.value)
      })),
      recentOrders: ordersResult.rows.map(o => ({
        ...o,
        total: `₹${Number(o.total || 0).toLocaleString('en-IN')}`,
        time: o.time
      })),
      recentActivity: activityResult.rows,
      productPerformance: performanceResult.rows.map((p, i) => ({
        rank: i + 1,
        ...p,
        performance: Math.round((Number(p.rating) || 4.5) * 20)
      }))
    };


    return res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error("ADMIN DASHBOARD DATA ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch dashboard data" });
  }
};

/**
 * Get Detailed Sellers List and Performance
 */
export const getSellersData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const sortBy = req.query.sortBy || "joinDate";
    const sortOrder = req.query.sortOrder === "asc" ? "ASC" : "DESC";

    let conditions = ["1=1"];
    let values = [];
    let valIdx = 1;

    if (search) {
      conditions.push(`(s.store_name ILIKE $${valIdx} OR s.full_name ILIKE $${valIdx} OR s.email ILIKE $${valIdx})`);
      values.push(`%${search}%`);
      valIdx++;
    }

    if (status) {
      if (status === "active") {
        conditions.push(`s.is_active = true AND s.is_verified = true`);
      } else if (status === "pending") {
        conditions.push(`s.is_active = true AND s.is_verified = false`);
      } else if (status === "suspended") {
        conditions.push(`s.is_active = false`);
      }
    }

    const whereClause = conditions.join(" AND ");

    // Mapping sortBy fields to database columns/subqueries
    const sortMapping = {
      name: 's.store_name',
      owner: 's.full_name',
      email: 's.email',
      joinDate: 's.created_at',
      products: 'products_count',
      orders: 'orders_count',
      revenue: 'revenue_sum',
      rating: 'rating_avg'
    };

    const dbSortField = sortMapping[sortBy] || 's.created_at';

    // Count query
    const countQuery = `
      SELECT COUNT(*) 
      FROM sellers s
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const totalSellers = parseInt(countResult.rows[0].count);

    // List query
    const sellersQuery = `
      SELECT 
        s.seller_id as id,
        s.store_name as name,
        s.full_name as owner,
        s.email,
        s.phone,
        s.is_verified,
        s.is_active,
        s.block_reason,
        s.created_at as "joinDate",
        (SELECT COUNT(*) FROM products WHERE seller_id = s.seller_id AND deleted_at IS NULL) as products_count,
        (SELECT COUNT(*) FROM order_sellers WHERE seller_id = s.seller_id) as orders_count,
        (SELECT COALESCE(SUM(os.seller_subtotal), 0) 
         FROM order_sellers os
         JOIN orders o ON o.order_id = os.order_id
         WHERE os.seller_id = s.seller_id 
           AND (o.payment_status = 'Paid' OR o.order_status = 'Delivered') 
           AND o.order_status != 'Cancelled' 
           AND o.is_deleted = false) as revenue_sum,
        COALESCE((SELECT AVG(rating) FROM products WHERE seller_id = s.seller_id), 0) as rating_avg
      FROM sellers s
      WHERE ${whereClause}
      ORDER BY ${dbSortField} ${sortOrder}
      LIMIT $${valIdx++} OFFSET $${valIdx++}
    `;

    const listValues = [...values, limit, offset];
    const result = await pool.query(sellersQuery, listValues);

    return res.status(200).json({
      success: true,
      pagination: {
        total: totalSellers,
        page,
        limit,
        pages: Math.ceil(totalSellers / limit)
      },
      data: result.rows.map(s => ({
        id: s.id,
        name: s.name,
        owner: s.owner,
        email: s.email,
        phone: s.phone,
        is_verified: s.is_verified,
        is_active: s.is_active,
        block_reason: s.block_reason,
        products: s.products_count,
        orders: s.orders_count,
        revenue: `₹${Number(s.revenue_sum).toLocaleString('en-IN')}`,
        rating: Number(Number(s.rating_avg).toFixed(1)),
        joinDate: new Date(s.joinDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        status: s.is_active ? (s.is_verified ? 'Active' : 'Pending KYC') : 'Suspended'
      }))
    });
  } catch (error) {
    console.error("GET SELLERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch sellers data" });
  }
};

/**
 * Get Financial Analytics and Transactions
 */
export const getFinanceData = async (req, res) => {
  try {
    const { range = 'monthly' } = req.query;

    // Build time filter against orders.placed_at
    let rangeFilter = "";
    if (range === 'daily') {
      rangeFilter = "AND o.placed_at >= CURRENT_DATE";
    } else if (range === 'monthly') {
      rangeFilter = "AND o.placed_at >= CURRENT_DATE - interval '1 month'";
    } else if (range === 'annual') {
      rangeFilter = "AND o.placed_at >= CURRENT_DATE - interval '1 year'";
    }

    // Valid orders = not cancelled AND (paid or delivered)
    const validOrderCondition = `
      o.order_status != 'Cancelled' 
      AND o.is_deleted = false
    `;

    // 1. Revenue & Profit Summary — Filtered by range
    const summaryResult = await pool.query(`
      SELECT 
        COALESCE(SUM(o.total_amount), 0) as gross_revenue,
        COALESCE(SUM(o.total_amount) * 0.10, 0) as platform_commission,
        COUNT(*) as total_orders
      FROM orders o
      WHERE ${validOrderCondition} ${rangeFilter}
    `);
    
    // Pending payouts (what we still owe sellers)
    const pendingPayoutsResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as pending_payouts
      FROM seller_payouts WHERE status IN ('Requested', 'Processing')
    `);

    const gross = parseFloat(summaryResult.rows[0].gross_revenue);
    const comm = parseFloat(summaryResult.rows[0].platform_commission);
    const totalOrders = parseInt(summaryResult.rows[0].total_orders);
    const pendingPayouts = parseFloat(pendingPayoutsResult.rows[0].pending_payouts);

    // 2. Trend Data grouped by month or year (sourced from orders)
    let trendQuery = '';
    if (range === 'annual') {
      trendQuery = `
        SELECT 
          y.year::text as name,
          COALESCE(SUM(o.total_amount), 0) as revenue,
          COALESCE(SUM(sp.amount), 0) as costs,
          COALESCE(SUM(o.total_amount) * 0.10, 0) as profit
        FROM (
          SELECT EXTRACT(YEAR FROM CURRENT_DATE) - i as year
          FROM generate_series(0, 4) i
        ) y
        LEFT JOIN orders o ON EXTRACT(YEAR FROM o.placed_at) = y.year
          AND o.order_status != 'Cancelled' AND o.is_deleted = false
        LEFT JOIN seller_payouts sp ON EXTRACT(YEAR FROM sp.created_at) = y.year
          AND sp.status = 'Paid'
        GROUP BY y.year
        ORDER BY y.year ASC
      `;
    } else {
      trendQuery = `
        SELECT 
          TO_CHAR(m.month, 'Mon') as name,
          COALESCE(SUM(o.total_amount), 0) as revenue,
          COALESCE(SUM(sp.amount), 0) as costs,
          COALESCE(SUM(o.total_amount) * 0.10, 0) as profit
        FROM (
          SELECT date_trunc('month', CURRENT_DATE) - (i || ' month')::interval as month
          FROM generate_series(0, 5) i
        ) m
        LEFT JOIN orders o ON date_trunc('month', o.placed_at) = m.month
          AND o.order_status != 'Cancelled' AND o.is_deleted = false
        LEFT JOIN seller_payouts sp ON date_trunc('month', sp.created_at) = m.month
          AND sp.status = 'Paid'
        GROUP BY m.month
        ORDER BY m.month ASC
      `;
    }
    const trendResult = await pool.query(trendQuery);

    // 3. Payouts Ledger
    const payoutsResult = await pool.query(`
      SELECT 
        p.payout_id as id,
        s.store_name as name,
        p.amount,
        p.status,
        p.created_at as date,
        COALESCE((
          SELECT SUM(os.seller_subtotal) 
          FROM order_sellers os 
          WHERE os.payout_id = p.payout_id
        ), p.amount) as revenue
      FROM seller_payouts p
      JOIN sellers s ON p.seller_id = s.seller_id
      ORDER BY p.created_at DESC
      LIMIT 20
    `);

    // 4. Recent Transactions ledger (from orders directly)
    const txnsResult = await pool.query(`
      SELECT 
        o.order_id as id,
        'order_payment' as type,
        c.full_name as seller,
        o.total_amount as amount,
        TO_CHAR(o.placed_at, 'DD Mon YYYY') as date,
        o.payment_status as status
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      WHERE o.order_status != 'Cancelled' AND o.is_deleted = false
      ORDER BY o.placed_at DESC
      LIMIT 15
    `);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          gross_revenue: gross,
          platform_commission: comm,
          net_profit: comm,
          total_orders: totalOrders,
          pending_payouts: pendingPayouts
        },
        monthlyPL: trendResult.rows.map(r => ({
          ...r,
          revenue: Number(r.revenue),
          costs: Number(r.costs),
          profit: Number(r.profit)
        })),
        payouts: payoutsResult.rows.map((p) => ({
          ...p,
          amount: Number(p.amount),
          revenue: Number(p.revenue)
        })),
        expenses: [],
        transactions: txnsResult.rows.map(r => ({
          ...r,
          amount: Number(r.amount)
        }))
      }
    });
  } catch (error) {
    console.error("GET FINANCE ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch financial data" });
  }
};

/**
 * Get Comprehensive Analytics (Sales, Reports, Payments)
 */
export const getAnalyticsData = async (req, res) => {
  try {
    const { range = 'daily' } = req.query;

    let rangeFilter = '';
    const r = range.toLowerCase();
    if (r === 'daily') rangeFilter = "AND o.placed_at >= CURRENT_DATE";
    else if (r === 'weekly') rangeFilter = "AND o.placed_at >= CURRENT_DATE - interval '1 week'";
    else if (r === 'monthly') rangeFilter = "AND o.placed_at >= CURRENT_DATE - interval '1 month'";
    else if (r === 'quarterly') rangeFilter = "AND o.placed_at >= CURRENT_DATE - interval '3 month'";
    else if (r === 'halfyearly' || r === 'half_yearly' || r === 'half-yearly' || r === 'halfyearly') rangeFilter = "AND o.placed_at >= CURRENT_DATE - interval '6 month'";
    else if (r === 'annual' || r === 'yearly') rangeFilter = "AND o.placed_at >= CURRENT_DATE - interval '1 year'";

    // 1. Sales by Category (All valid orders)
    const categoryResult = await pool.query(`
      SELECT p.room as category, SUM(oi.quantity * oi.unit_price) as revenue, COUNT(oi.order_item_id) as sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_status != 'Cancelled' AND o.is_deleted = false ${rangeFilter}
      GROUP BY p.room ORDER BY revenue DESC
    `);

    // 2. Top Performing Products
    const productsResult = await pool.query(`
      SELECT p.name, s.store_name as seller, SUM(oi.quantity) as qty, SUM(oi.quantity * oi.unit_price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN sellers s ON p.seller_id = s.seller_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_status != 'Cancelled' AND o.is_deleted = false ${rangeFilter}
      GROUP BY p.name, s.store_name ORDER BY revenue DESC LIMIT 10
    `);

    // 3. Summary Stats
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN o.order_status = 'Delivered' THEN oi_count.item_count ELSE 0 END), 0) as total_items_sold
      FROM orders o
      LEFT JOIN (
        SELECT order_id, SUM(quantity) as item_count FROM order_items GROUP BY order_id
      ) oi_count ON o.order_id = oi_count.order_id
      WHERE o.is_deleted = false AND o.order_status != 'Cancelled' ${rangeFilter}
    `);

    // 4. Payment Status Breakdown
    const paymentStatsResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE (payment_status = 'Paid' OR order_status = 'Delivered') AND order_status != 'Cancelled') as success,
        COUNT(*) FILTER (WHERE order_status = 'Cancelled') as cancelled,
        COUNT(*) FILTER (WHERE order_status != 'Cancelled' AND payment_status != 'Paid' AND order_status != 'Delivered') as pending
      FROM orders WHERE is_deleted = false
    `);

    // 6. Trend Configuration
    let trendStep = 'day';
    let trendCount = 14;
    let trendFmt = 'DD Mon';
    let trendOffset = 0;

    if (r === 'daily') { trendStep = 'day'; trendCount = 13; trendFmt = 'DD Mon'; trendOffset = -1; }
    else if (r === 'weekly') { trendStep = 'week'; trendCount = 11; trendFmt = 'W-WW'; trendOffset = -1; }
    else if (r === 'monthly') { trendStep = 'month'; trendCount = 11; trendFmt = 'Mon YY'; }
    else if (r === 'quarterly') { trendStep = 'month'; trendCount = 11; trendFmt = 'Mon YY'; }
    else if (r === 'halfyearly' || r === 'half_yearly' || r === 'half-yearly' || r === 'halfyearly') { trendStep = 'month'; trendCount = 11; trendFmt = 'Mon YY'; }
    else if (r === 'annual' || r === 'yearly') { trendStep = 'month'; trendCount = 11; trendFmt = 'Mon YY'; }
    else if (r === 'all') { trendStep = 'month'; trendCount = 59; trendFmt = 'Mon YY'; }

    // 7. Dynamic Trend
    const trendResult = await pool.query(`
      SELECT 
        TO_CHAR(t.date, '${trendFmt}') as name,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COALESCE(SUM(sp.amount), 0) as costs,
        COUNT(o.order_id) as orders,
        COALESCE(SUM(o.total_amount) * 0.10, 0) as profit
      FROM (
        SELECT date_trunc('${trendStep}', NOW()) - (i || ' ${trendStep}')::interval as date
        FROM generate_series(${trendOffset}, ${trendCount} + ${trendOffset}) i
      ) t
      LEFT JOIN orders o ON date_trunc('${trendStep}', o.placed_at) = t.date 
        AND o.order_status != 'Cancelled' 
        AND o.is_deleted = false
      LEFT JOIN seller_payouts sp ON date_trunc('${trendStep}', sp.created_at) = t.date
        AND sp.status = 'Paid'
      GROUP BY t.date
      ORDER BY t.date ASC
    `);

    // 7. Recent Returns
    const returnsResult = await pool.query(`
      SELECT o.order_id as orderId, c.full_name as customer, o.total_amount as amount, o.order_status as status, o.placed_at as date
      FROM orders o JOIN customers c ON o.customer_id = c.customer_id
      WHERE o.order_status = 'Cancelled' AND o.is_deleted = false LIMIT 10
    `);

    // 8. Category Distribution
    const categoryDistributionResult = await pool.query(`
      SELECT room as name, COUNT(*) as value
      FROM products WHERE deleted_at IS NULL
      GROUP BY room ORDER BY value DESC
    `);

    // 9. Order Status Distribution
    const statusDistributionResult = await pool.query(`
      SELECT order_status as name, COUNT(*) as value
      FROM orders WHERE is_deleted = false
      GROUP BY order_status
    `);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          total_orders: Number(summaryResult.rows[0].total_orders),
          total_revenue: Number(summaryResult.rows[0].total_revenue),
          total_items_sold: Number(summaryResult.rows[0].total_items_sold)
        },
        trend: trendResult.rows.map(r => ({
          ...r,
          revenue: Number(r.revenue),
          costs: Number(r.costs),
          profit: Number(r.profit),
          orders: Number(r.orders)
        })),
        categorySales: categoryResult.rows.map(r => ({
          ...r,
          revenue: Number(r.revenue),
          sales: Number(r.sales)
        })),
        categoryDistribution: categoryDistributionResult.rows.map(r => ({ ...r, value: Number(r.value) })),
        statusDistribution: statusDistributionResult.rows.map(r => ({ ...r, value: Number(r.value) })),
        recentDeliveries: (await pool.query(`
          SELECT d.*, o.total_amount, a.full_name as customer_name
          FROM deliveries d
          JOIN orders o ON d.order_id = o.order_id
          JOIN addresses a ON o.address_id = a.address_id
          ORDER BY d.updated_at DESC
          LIMIT 10
        `)).rows,
        topProducts: productsResult.rows.map(r => ({
          ...r,
          qty: Number(r.qty),
          revenue: Number(r.revenue)
        })),
        paymentStats: {
          total: Number(paymentStatsResult.rows[0].total),
          success: Number(paymentStatsResult.rows[0].success),
          cancelled: Number(paymentStatsResult.rows[0].cancelled),
          pending: Number(paymentStatsResult.rows[0].pending)
        },
        recentReturns: returnsResult.rows.map(r => ({
          id: `RET-${(r.orderId || '').split('-')[0] || 'N/A'}`,
          ...r,
          reason: "Not Specified",
          amount: `₹${Number(r.amount).toLocaleString('en-IN')}`,
          date: new Date(r.date).toLocaleDateString('en-IN')
        }))
      }
    });
  } catch (error) {
    console.error("GET ANALYTICS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics data" });
  }
};

/**
 * Get All Payments (Admin View)
 */
export const getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) FROM orders WHERE is_deleted = false`;
    const countResult = await pool.query(countQuery);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    const paymentsQuery = `
      SELECT 
        o.order_id as id,
        c.full_name as customer,
        o.total_amount as amount,
        o.payment_method as method,
        o.order_status as status,
        o.payment_status,
        o.cod_fee,
        o.placed_at as date
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      WHERE o.is_deleted = false
      ORDER BY o.placed_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(paymentsQuery, [limit, offset]);

    const statsQuery = `
      SELECT 
        COALESCE(SUM(total_amount) FILTER (
          WHERE order_status != 'Cancelled' AND (payment_status = 'Paid' OR order_status = 'Delivered')
        ), 0) as total,
        COUNT(CASE 
          WHEN order_status != 'Cancelled' AND (payment_status = 'Paid' OR order_status = 'Delivered') THEN 1 
          ELSE NULL 
        END) as success,
        COUNT(CASE WHEN order_status = 'Cancelled' THEN 1 END) as cancelled,
        COUNT(CASE 
          WHEN order_status != 'Cancelled' AND payment_status != 'Paid' AND order_status != 'Delivered' THEN 1 
          ELSE NULL 
        END) as pending
      FROM orders
      WHERE is_deleted = false
    `;
    const statsResult = await pool.query(statsQuery);

    return res.status(200).json({
      success: true,
      data: result.rows.map(r => {
        let paymentStatus = 'Pending';
        let methodLabel = r.method;
        // Identify payment type
        const isCOD = r.method === 'cod' || parseFloat(r.cod_fee || 0) > 0;

        if (isCOD) {
          methodLabel = 'PostPaid';
        } else if (r.method === 'Prepaid' || r.method === 'razorpay') {
          methodLabel = 'Online';
        }

        // Determine Payment Status
        if (r.status === 'Cancelled') {
          paymentStatus = 'Cancelled';
        } else if (r.payment_status === 'Paid' || r.status === 'Delivered') {
          paymentStatus = 'Success';
        } else {
          paymentStatus = 'Pending';
        }

        return {
          ...r,
          method: methodLabel,
          amount: `₹${Number(r.amount).toLocaleString('en-IN')}`,
          date: new Date(r.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: paymentStatus
        };
      }),
      stats: {
        total: `₹${Number(statsResult.rows[0].total).toLocaleString('en-IN')}`,
        success: statsResult.rows[0].success,
        cancelled: statsResult.rows[0].cancelled,
        pending: statsResult.rows[0].pending
      },
      pagination: {
        total_items: totalItems,
        total_pages: totalPages,
        current_page: page,
        limit
      }
    });
  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
};

/**
 * Get All Returns (Admin View) - Synced with return_requests table
 */
export const getAllReturns = async (req, res) => {
  try {
    const returnsQuery = `
      SELECT 
        rr.return_request_id as id,
        c.full_name as customer,
        rr.refund_amount as amount,
        rr.refund_status as status,
        rr.requested_at as date,
        rr.reason,
        rr.order_id,
        rr.return_type,
        p.name as product_name
      FROM return_requests rr
      LEFT JOIN customers c ON rr.customer_id = c.customer_id
      LEFT JOIN order_items oi ON rr.order_item_id = oi.order_item_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      ORDER BY rr.requested_at DESC
    `;
    const result = await pool.query(returnsQuery);

    return res.status(200).json({
      success: true,
      data: result.rows.map(r => ({
        ...r,
        id: r.id, // Keep the UUID for internal use
        displayId: r.id ? `RET-${r.id.split('-')[0].toUpperCase()}` : 'N/A',
        orderId: r.order_id || 'N/A',
        amount: `₹${Number(r.amount || 0).toLocaleString('en-IN')}`,
        date: r.date ? new Date(r.date).toLocaleDateString('en-IN') : 'N/A',
        status: r.status || 'Pending'
      }))
    });
  } catch (error) {
    console.error("GET RETURNS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch returns" });
  }
};

/**
 * Resolve Return Request (Approve/Reject)
 */
export const resolveReturnRequest = async (req, res) => {
  const { id } = req.params; // return_request_id
  const { status, resolution_note, admin_id } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch return request details
    const rrRes = await client.query(
      `SELECT rr.*, o.address_id, oi.seller_id, oi.product_id, oi.variant_id, oi.quantity, oi.unit_price,
              c.full_name as cust_name, c.email as cust_email, c.phone as cust_phone,
              a.address_line_1, a.city, a.state, a.pincode, p.name as product_name
       FROM return_requests rr
       LEFT JOIN orders o ON rr.order_id = o.order_id
       LEFT JOIN order_items oi ON rr.order_item_id = oi.order_item_id
       LEFT JOIN products p ON oi.product_id = p.product_id
       LEFT JOIN customers c ON rr.customer_id = c.customer_id
       LEFT JOIN addresses a ON o.address_id = a.address_id
       WHERE rr.return_request_id = $1`,
      [id]
    );

    if (rrRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    const rr = rrRes.rows[0];

    if (status === 'Received') {
      if (rr.refund_status !== 'Approved') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: "Cannot mark as received unless the return is currently 'Approved'." });
      }

      // Check original order payment method
      const paymentQuery = `
        SELECT p.payment_id, p.payment_method, p.payment_status 
        FROM payments p 
        WHERE p.order_id = $1
      `;
      const paymentRes = await client.query(paymentQuery, [rr.order_id]);
      
      let refundNotes = resolution_note || `Returned item received by Admin`;
      let actualRefundStatus = 'Refunded';

      if (paymentRes.rows.length > 0) {
        const payment = paymentRes.rows[0];
        if ((payment.payment_method === 'Prepaid' || payment.payment_method === 'razorpay' || payment.payment_method === 'online') && payment.payment_status === 'Paid') {
          // Process Razorpay Refund
          if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
            try {
              const razorpay = new Razorpay({ 
                key_id: process.env.RAZORPAY_KEY_ID, 
                key_secret: process.env.RAZORPAY_KEY_SECRET 
              });
              await razorpay.payments.refund(payment.payment_id, { 
                amount: Math.round(parseFloat(rr.refund_amount) * 100) 
              });
              refundNotes += " | Refund automatically processed to original payment method.";
            } catch (refundErr) {
              console.error("Razorpay Refund Error:", refundErr);
              refundNotes += ` | Failed to auto-refund via Razorpay: ${refundErr.message || 'Unknown error'}`;
              actualRefundStatus = 'Received'; // Item received, but refund failed (manual intervention needed)
            }
          } else {
             refundNotes += " | Razorpay keys missing, manual refund required.";
             actualRefundStatus = 'Received';
          }
        } else if (payment.payment_method === 'cod') {
          refundNotes += " | COD order: Refund must be manually transferred to customer's bank/wallet.";
          actualRefundStatus = 'Received';
        }
      } else {
        refundNotes += " | Original payment record not found.";
        actualRefundStatus = 'Received';
      }

      // 2. Update status in return_requests
      await client.query(
        `UPDATE return_requests 
         SET refund_status = $1, resolution_note = $2, resolved_by_admin_id = $3, resolved_at = NOW()
         WHERE return_request_id = $4`,
        [actualRefundStatus, refundNotes, admin_id, id]
      );
      
      status = actualRefundStatus; // Set for notifications

    } else {
      // 2. Update status in return_requests
      await client.query(
        `UPDATE return_requests 
         SET refund_status = $1, resolution_note = $2, resolved_by_admin_id = $3, resolved_at = NOW()
         WHERE return_request_id = $4`,
        [status, resolution_note, admin_id, id]
      );
    }

    if (status === 'Approved') {
      // 3. Initiate Shiprocket Reverse Pickup
      // Fetch seller pickup location (where item should be returned)
      const sellerPickup = await client.query(
        "SELECT * FROM seller_pickup_location WHERE seller_id = $1 AND is_default = true",
        [rr.seller_id]
      );

      if (sellerPickup.rows.length > 0) {
        const pickup = sellerPickup.rows[0];

        // Construct Shiprocket Payload for Return
        const srPayload = {
          order_id: `RET-${rr.return_request_id.slice(0, 8)}`,
          order_date: new Date().toISOString().split('T')[0],
          pickup_customer_name: rr.cust_name,
          pickup_last_name: "",
          pickup_address: rr.address_line_1,
          pickup_city: rr.city,
          pickup_state: rr.state,
          pickup_country: "India",
          pickup_pincode: rr.pincode,
          pickup_email: rr.cust_email,
          pickup_phone: rr.cust_phone,
          shipping_customer_name: pickup.contact_name,
          shipping_last_name: "",
          shipping_address: pickup.address_line_1,
          shipping_city: pickup.city,
          shipping_state: pickup.state,
          shipping_country: "India",
          shipping_pincode: pickup.pincode,
          shipping_email: pickup.email || "support@marketplace.com",
          shipping_phone: pickup.contact_phone,
          order_items: [
            {
              name: rr.product_name || "Return Item",
              sku: rr.product_id.slice(0, 8),
              units: rr.quantity,
              selling_price: rr.unit_price
            }
          ],
          payment_method: "Prepaid",
          sub_total: rr.refund_amount,
          length: 10,
          breadth: 10,
          height: 10,
          weight: 0.5
        };

        try {
          const srReturn = await createShiprocketReturn(srPayload);

          if (srReturn && (srReturn.status_code === 1 || srReturn.shipment_id)) {
            // Log reverse shipment
            await client.query(
              `INSERT INTO reverse_shipments (
                    reverse_id, return_request_id, order_item_id, seller_id, customer_id, 
                    pickup_address_id, dropoff_pickup_location_id,
                    shiprocket_reverse_order_id, reverse_awb_code, status, initiated_at
                ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'Initiated', NOW())`,
              [id, rr.order_item_id, rr.seller_id, rr.customer_id, rr.address_id, pickup.pickup_id, srReturn.order_id, srReturn.awb_code || null]
            );

            // Update order item status
            await client.query(
              "UPDATE order_items SET item_status = 'Return Initiated' WHERE order_item_id = $1",
              [rr.order_item_id]
            );
          } else {
            console.warn('Shiprocket Return Sync Warning:', srReturn);
          }
        } catch (srError) {
          console.error('Shiprocket Return Sync Exception:', srError.message);
        }
      }
    } else if (status === 'Rejected') {
      // Just update the status, which was already done at step 2.
    }

    // 4. Notify Customer
    let notificationMsg = `Your return request for Order #${rr.order_id.slice(0, 8).toUpperCase()} has been ${status}.`;
    if (status === 'Received' || status === 'Refunded') {
       notificationMsg = `We have received your returned item for Order #${rr.order_id.slice(0, 8).toUpperCase()}. Your return request is marked as ${status}.`;
    }

    await client.query(
      `INSERT INTO notifications (notification_id, customer_id, type, message, created_at)
       VALUES (gen_random_uuid(), $1, 'return_update', $2, NOW())`,
      [rr.customer_id, notificationMsg]
    );

    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: `Return request ${status} successfully.` });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("RESOLVE RETURN ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to resolve return request" });
  } finally {
    client.release();
  }
};

/**
 * Get All Orders (Admin View)
 */
export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) FROM orders WHERE is_deleted = false`;
    const countResult = await pool.query(countQuery);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    const ordersQuery = `
      SELECT 
        o.order_id as id,
        c.full_name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        o.total_amount,
        o.order_status as status,
        o.payment_method,
        o.placed_at as created_at,
        COALESCE(a.address_line_1 || ', ' || a.city || ', ' || a.state || ' - ' || a.pincode, 'No Address Provided') as shipping_address,
        o.courier,
        o.tracking_id,
        o.estimated_delivery,
        (
          SELECT json_agg(json_build_object(
            'product_id', oi.product_id,
            'name', p.name,
            'price', oi.unit_price,
            'quantity', oi.quantity,
            'image', p.images[1]
          ))
          FROM order_items oi
          JOIN products p ON oi.product_id = p.product_id
          WHERE oi.order_id = o.order_id
        ) as items
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN addresses a ON o.address_id = a.address_id
      WHERE o.is_deleted = false
      ORDER BY o.placed_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(ordersQuery, [limit, offset]);

    return res.status(200).json({ 
      success: true, 
      data: result.rows || [],
      pagination: {
        total_items: totalItems,
        total_pages: totalPages,
        current_page: page,
        limit
      }
    });
  } catch (error) {
    console.error("GET ALL ORDERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

/**
 * Get All Customers (Admin View)
 */
export const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL`;
    const countResult = await pool.query(countQuery);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    const customersQuery = `
      SELECT 
        customer_id,
        full_name as name,
        email,
        phone,
        created_at,
        is_active,
        block_reason
      FROM customers
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(customersQuery, [limit, offset]);
    return res.status(200).json({ 
      success: true, 
      data: result.rows,
      pagination: {
        total_items: totalItems,
        total_pages: totalPages,
        current_page: page,
        limit
      }
    });
  } catch (error) {
    console.error("GET ALL CUSTOMERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch customers" });
  }
};

/**
 * Toggle Customer Active Status with Reason
 */
export const toggleCustomerStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active, block_reason } = req.body;
  try {
    const updateQuery = `
      UPDATE customers 
      SET is_active = $1, block_reason = $2, updated_at = NOW() 
      WHERE customer_id = $3 AND is_active != $1
      RETURNING is_active, block_reason`;
    const result = await pool.query(updateQuery, [is_active, is_active ? null : block_reason, id]);

    if (result.rowCount === 0) {
      // Check if it failed because it was already in that state
      const check = await pool.query("SELECT is_active FROM customers WHERE customer_id = $1", [id]);
      if (check.rowCount > 0) {
        return res.status(200).json({
          success: true,
          message: `Customer is already ${is_active ? 'active' : 'blocked'}`,
          is_active: check.rows[0].is_active
        });
      }
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Customer ${is_active ? 'unblocked' : 'blocked'} successfully`,
      is_active: result.rows[0].is_active,
      block_reason: result.rows[0].block_reason
    });
  } catch (error) {
    console.error("TOGGLE CUSTOMER STATUS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

/**
 * Get Detailed Customer Profile (Admin View)
 */
export const getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customerQuery = `
      SELECT customer_id, full_name, email, phone, created_at, is_active, block_reason 
      FROM customers WHERE customer_id = $1 AND deleted_at IS NULL
    `;
    const customerRes = await pool.query(customerQuery, [id]);
    
    if (customerRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    
    const addressesQuery = `
      SELECT * FROM addresses WHERE user_id = $1 AND user_type = 'customer'
    `;
    const addressesRes = await pool.query(addressesQuery, [id]);
    
    return res.status(200).json({
      success: true,
      data: {
        ...customerRes.rows[0],
        addresses: addressesRes.rows
      }
    });
  } catch (error) {
    console.error("GET CUSTOMER DETAILS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch customer details" });
  }
};

/**
 * Super Admin: Delete Customer Account
 */
export const deleteCustomer = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    if (req.user.type !== 'super_admin') {
      return res.status(403).json({ success: false, message: "Unauthorized: Only Super Administrators can purge accounts." });
    }

    await client.query('BEGIN');

    // 1. Check if customer exists
    const checkRes = await client.query("SELECT full_name FROM customers WHERE customer_id = $1", [id]);
    if (checkRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Customer account not found" });
    }

    // 2. Delete associated private data
    await client.query("DELETE FROM notifications WHERE customer_id = $1", [id]);
    await client.query("DELETE FROM cart WHERE customer_id = $1", [id]);
    await client.query("DELETE FROM wishlist WHERE customer_id = $1", [id]);
    
    // 3. Mark customer as deleted (Soft delete for audit but purge private fields)
    await client.query(`
      UPDATE customers 
      SET deleted_at = NOW(), 
          email = 'deleted_' || customer_id || '@marketplace.com',
          phone = '0000000000',
          full_name = 'Deleted User',
          is_active = false
      WHERE customer_id = $1
    `, [id]);

    await logAudit({
      admin_id: req.user.id,
      action: 'PURGE_CUSTOMER',
      table_name: 'customers',
      record_id: id,
      req
    });

    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: "Customer account purged successfully" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("DELETE CUSTOMER ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to purge customer account" });
  } finally {
    client.release();
  }
};

/**
 * Toggle Seller Active Status with Reason
 */
export const toggleSellerStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active, block_reason, block_duration_days } = req.body;
  try {
    let blockedUntil = null;
    if (!is_active && block_duration_days && !isNaN(parseInt(block_duration_days, 10))) {
       blockedUntil = new Date();
       blockedUntil.setDate(blockedUntil.getDate() + parseInt(block_duration_days, 10));
    }

    const updateQuery = `
      UPDATE sellers 
      SET is_active = $1, block_reason = $2, blocked_until = $3, updated_at = NOW() 
      WHERE seller_id = $4
      RETURNING is_active, block_reason, blocked_until`;
    const result = await pool.query(updateQuery, [is_active, is_active ? null : block_reason, is_active ? null : blockedUntil, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Seller ${is_active ? 'unblocked' : 'blocked'} successfully`,
      is_active: result.rows[0].is_active,
      block_reason: result.rows[0].block_reason,
      blocked_until: result.rows[0].blocked_until
    });
  } catch (error) {
    console.error("TOGGLE SELLER STATUS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

/**
 * Verify Seller KYC Status
 */
export const verifySeller = async (req, res) => {
  const { id } = req.params;
  const { is_verified } = req.body;
  try {
    const result = await pool.query(
      "UPDATE sellers SET is_verified = $1, updated_at = NOW() WHERE seller_id = $2 RETURNING is_verified",
      [is_verified, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Seller verification status updated to ${is_verified ? 'Verified' : 'Pending'}`,
      is_verified: result.rows[0].is_verified
    });
  } catch (error) {
    console.error("VERIFY SELLER ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update verification status" });
  }
};

/**
 * Get Detailed Seller Profile & Addresses
 */
export const getSellerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Basic Info
    const sellerRes = await pool.query(`
      SELECT 
        seller_id as id, store_name as name, full_name as owner, email, phone, 
        is_verified, is_active, block_reason, created_at as "joinDate",
        aadhar, gstin, pan
      FROM sellers WHERE seller_id = $1
    `, [id]);

    if (sellerRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    // 2. Performance Metrics
    const metricsRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM products WHERE seller_id = $1 AND deleted_at IS NULL) as products,
        (SELECT COUNT(*) FROM order_sellers WHERE seller_id = $1) as orders,
        (SELECT COALESCE(SUM(seller_subtotal), 0) FROM order_sellers WHERE seller_id = $1) as total_revenue
      FROM sellers WHERE seller_id = $1
    `, [id]);

    // 3. Pickup Addresses
    const addressesRes = await pool.query(`
      SELECT * FROM seller_pickup_location WHERE seller_id = $1 ORDER BY is_default DESC
    `, [id]);

    return res.status(200).json({
      success: true,
      data: {
        ...sellerRes.rows[0],
        metrics: metricsRes.rows[0],
        addresses: addressesRes.rows
      }
    });
  } catch (error) {
    console.error("GET SELLER DETAILS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch seller details" });
  }
};

/**
 * Super Admin: Delete Seller Account
 * Performed within a transaction to ensure all dependencies are handled.
 */
export const deleteSeller = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if seller exists
    const checkRes = await client.query("SELECT seller_id, store_name FROM sellers WHERE seller_id = $1", [id]);
    if (checkRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Seller account not found" });
    }

    const sellerName = checkRes.rows[0].store_name;

    // 2. Perform explicit cleanup for non-cascading dependencies if any
    // Note: Most are handled by the new database constraints (ON DELETE CASCADE/SET NULL)
    
    // 3. Final: Delete the seller record
    await client.query("DELETE FROM sellers WHERE seller_id = $1", [id]);

    // 4. Log the action in audit logs
    await client.query(`
      INSERT INTO audit_logs (audit_id, admin_id, table_name, record_id, action, new_values, created_at)
      VALUES (gen_random_uuid(), $1, 'sellers', $2, 'DELETE_SELLER', $3, NOW())
    `, [req.user.id, id, JSON.stringify({ store_name: sellerName })]);

    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: "Seller account and associated data removed successfully" });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("DELETE SELLER ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to delete seller account. Please try again." });
  } finally {
    client.release();
  }
};

/**
 * Change Admin Password
 */
export const changeAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if requester is Super Admin
    if (!req.user || req.user.type !== 'super_admin') {
      return res.status(403).json({ success: false, message: "Unauthorized: Only Super Administrators can change passwords." });
    }



    // Check if target is an admin or another super admin
    const adminCheck = await pool.query("SELECT admin_id FROM admins WHERE admin_id = $1", [id]);
    const saCheck = await pool.query("SELECT super_admin_id FROM super_admins WHERE super_admin_id = $1", [id]);

    // Explicitly validate the target account type
    let table = null;
    let idCol = null;

    if (adminCheck.rows.length > 0) {
      table = 'admins';
      idCol = 'admin_id';
    } else if (saCheck.rows.length > 0) {
      table = 'super_admins';
      idCol = 'super_admin_id';
    }

    if (!table) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // Fetch target details for email
    let targetInfo;
    if (table === 'super_admins') {
      targetInfo = await pool.query(`SELECT name, email FROM super_admins WHERE super_admin_id = $1`, [id]);
    } else {
      targetInfo = await pool.query(`SELECT name, email FROM admins WHERE admin_id = $1`, [id]);
    }
    const { name, email } = targetInfo.rows[0];

    // Generate a secure random token and trigger a reset link instead of setting a plaintext password
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashOtp(resetToken);
    const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await pool.query(
      `INSERT INTO otp_verifications (email, otp_hash, expires_at, purpose)
       VALUES ($1, $2, $3, 'admin_password_reset')
       ON CONFLICT (email, purpose) DO UPDATE 
       SET otp_hash = $2, expires_at = $3, is_verified = false, attempts = 0`,
      [email, tokenHash, expires_at]
    );

    // Send automated email via Nodemailer with reset link
    await sendAdminPasswordResetEmail(email, name, resetToken);

    await logAudit({
      admin_id: req.user.id,
      action: 'PASSWORD_RESET',
      table_name: table,
      record_id: id,
      req
    });

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update password" });
  }
};

/**
 * Super Admin: Get All Administrators
 */
export const getAllAdministrators = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT admin_id as id, name, email, role, is_active, last_login_at, created_at FROM admins ORDER BY created_at DESC"
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET ALL ADMINS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch administrators" });
  }
};

/**
 * Super Admin: Update Administrator Status (Block/Unblock)
 */
export const updateAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const result = await pool.query(
      "UPDATE admins SET is_active = $1, updated_at = NOW() WHERE admin_id = $2 AND is_active != $1",
      [is_active, id]
    );

    if (result.rowCount === 0) {
      const check = await pool.query("SELECT is_active FROM admins WHERE admin_id = $1", [id]);
      if (check.rowCount > 0) {
        return res.status(200).json({
          success: true,
          message: `Administrator is already ${is_active ? 'active' : 'blocked'}`,
          is_active: check.rows[0].is_active
        });
      }
      return res.status(404).json({ success: false, message: "Administrator not found" });
    }

    await logAudit({
      admin_id: req.user.id,
      action: is_active ? 'UNBLOCK_ADMIN' : 'BLOCK_ADMIN',
      table_name: 'admins',
      record_id: id,
      req
    });

    return res.status(200).json({ success: true, message: `Administrator ${is_active ? 'unblocked' : 'blocked'} successfully` });
  } catch (error) {
    console.error("UPDATE ADMIN STATUS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update administrator status" });
  }
};

/**
 * Super Admin: Delete Administrator
 */
export const deleteAdministrator = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // 1. Delete associated notifications
    await client.query("DELETE FROM notifications WHERE admin_id = $1", [id]);

    // 2. Nullify references in return_requests
    await client.query("UPDATE return_requests SET resolved_by_admin_id = NULL WHERE resolved_by_admin_id = $1", [id]);

    // 3. Nullify references in seller_payouts
    await client.query("UPDATE seller_payouts SET initiated_by_admin_id = NULL WHERE initiated_by_admin_id = $1", [id]);

    // 3.5. Nullify references in audit_logs
    await client.query("UPDATE audit_logs SET admin_id = NULL WHERE admin_id = $1", [id]);

    // 4. Delete the admin record
    await client.query("DELETE FROM admins WHERE admin_id = $1", [id]);

    // 5. Delete shadow customer record
    await client.query("DELETE FROM customers WHERE customer_id = $1", [id]);

    await logAudit({
      admin_id: req.user.id,
      action: 'DELETE_ADMIN',
      table_name: 'admins',
      record_id: id,
      req
    });

    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: "Administrator account deleted permanently" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("DELETE ADMIN ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to delete administrator account" });
  } finally {
    client.release();
  }
};

/**
 * Bulk Update Orders
 */
export const bulkUpdateOrders = async (req, res) => {
  try {
    const { orderIds, status, courier } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: "No orders selected" });
    }

    // Security: Validate all orderIds as UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const id of orderIds) {
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ success: false, message: "Invalid order ID format detected" });
      }
    }

    // Security: Validation for status and courier
    const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
    const allowedCouriers = ['Delhivery', 'BlueDart', 'Ecom Express', 'Shadowfax', 'Xpressbees', 'Shiprocket', 'Bulk Update', 'Other'];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }
    if (courier && !allowedCouriers.includes(courier)) {
      return res.status(400).json({ success: false, message: "Invalid courier name" });
    }

    let query = `UPDATE orders SET updated_at = NOW()`;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += `, order_status = $${paramIndex++}`;
      params.push(status);
    }
    if (courier) {
      query += `, courier = $${paramIndex++}`;
      params.push(courier);
    }

    query += ` WHERE order_id = ANY($${paramIndex}) RETURNING order_id`;
    params.push(orderIds);

    const result = await pool.query(query, params);

    // Sync with deliveries table for bulk actions
    if (status) {
      await pool.query(`
            INSERT INTO deliveries (delivery_id, order_id, courier_name, awb_code, shipping_status, dispatched_at, delivered_at, updated_at, created_at)
            SELECT gen_random_uuid(), id, $1, 'N/A', $2::varchar, 
                CASE WHEN $2::varchar = 'Shipped' OR $2::varchar = 'Delivered' THEN NOW() ELSE NULL END,
                CASE WHEN $2::varchar = 'Delivered' THEN NOW() ELSE NULL END,
                NOW(), NOW()
            FROM unnest($3::uuid[]) as id
            ON CONFLICT (order_id) DO UPDATE SET
                courier_name = EXCLUDED.courier_name,
                shipping_status = EXCLUDED.shipping_status,
                dispatched_at = COALESCE(deliveries.dispatched_at, EXCLUDED.dispatched_at),
                delivered_at = COALESCE(deliveries.delivered_at, EXCLUDED.delivered_at),
                updated_at = NOW()
        `, [courier || 'Bulk Update', status, orderIds]);

      // Dispatch notifications to customers and sellers
      for (const orderId of orderIds) {
        await sendOrderStatusNotifications(orderId, status, pool, courier);
      }
    }

    // Log the bulk action
    await logAudit({
      admin_id: req.user.id,
      action: 'BULK_UPDATE',
      table_name: 'orders',
      record_id: null,
      new_values: { updated_count: result.rowCount, orderIds },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Successfully updated ${result.rowCount} orders`,
      updatedCount: result.rowCount
    });

  } catch (error) {
    console.error("BULK UPDATE ORDERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Internal server error during bulk update" });
  }
};

// Export yearly transactions as a professional bank statement CSV
export const exportFinanceReport = async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  try {
    const query = `
      SELECT 
        ft.created_at,
        ft.transaction_type,
        ft.amount,
        o.order_id as order_ref,
        sp.payout_id as payout_ref,
        sp.transaction_ref as utr,
        s.store_name,
        o.payment_method
      FROM finance_transactions ft
      LEFT JOIN orders o ON ft.order_id = o.order_id
      LEFT JOIN seller_payouts sp ON ft.seller_payout_id = sp.payout_id
      LEFT JOIN sellers s ON sp.seller_id = s.seller_id
      WHERE EXTRACT(YEAR FROM ft.created_at) = $1
      ORDER BY ft.created_at ASC
    `;
    const result = await pool.query(query, [year]);

    if (result.rows.length === 0) {
      return res.status(200).send("Date,Description,Reference,Debit (₹),Credit (₹),Balance (₹)\nNo transactions found for this year.");
    }

    const csvRows = [
      `FINANCIAL STATEMENT - YEAR ${year}`,
      `Generated on: ${new Date().toLocaleString()}`,
      "",
      "Date,Description,Reference,Debit (₹),Credit (₹),Balance (₹)"
    ];

    let runningBalance = 0;

    for (const row of result.rows) {
      const date = new Date(row.created_at).toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }).replace(',', '');

      let description = "";
      let reference = "";
      let debit = "";
      let credit = "";

      if (row.transaction_type === 'payout') {
        description = `Payout to ${row.store_name || 'Seller'}`;
        reference = row.utr || row.payout_ref || 'N/A';
        debit = parseFloat(row.amount).toFixed(2);
        runningBalance -= parseFloat(row.amount);
      } else {
        description = `Order Payment - ${row.payment_method || 'Online'}`;
        reference = row.order_ref || 'N/A';
        credit = parseFloat(row.amount).toFixed(2);
        runningBalance += parseFloat(row.amount);
      }

      const line = [
        `"${date}"`,
        `"${description}"`,
        `"${reference}"`,
        debit ? `"${debit}"` : "",
        credit ? `"${credit}"` : "",
        `"${runningBalance.toFixed(2)}"`
      ];
      csvRows.push(line.join(','));
    }

    const csvString = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Bank_Statement_${year}.csv`);
    res.status(200).send(csvString);

  } catch (error) {
    console.error("EXPORT FINANCE REPORT ERROR:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Smart Auto-Dispatch All Pending Orders
 */
export const autoDispatchOrders = async (req, res) => {
  try {
    // 1. Find all 'Processing' orders
    const pendingOrders = await pool.query("SELECT order_id FROM orders WHERE order_status = 'Processing' AND is_deleted = false");

    if (pendingOrders.rows.length === 0) {
      return res.status(200).json({ success: true, message: "No pending orders to dispatch", count: 0 });
    }

    const orderIds = pendingOrders.rows.map(o => o.order_id);
    const results = {
      success: 0,
      failed: 0,
      details: []
    };

    // 2. Process each order through Intelligent Auto-Pilot
    for (const orderId of orderIds) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Intelligent Push (Order -> Serviceability -> AWB -> Pickup)
        const srData = await pushOrderToShiprocket(orderId, client);

        // Update local order status
        await client.query(`
          UPDATE orders 
          SET 
            order_status = 'Shipped', 
            courier = $1, 
            tracking_id = $2,
            updated_at = NOW() 
          WHERE order_id = $3
        `, [srData.courier, srData.awb_code, orderId]);

        // Sync with deliveries table
        await client.query(`
          INSERT INTO deliveries (delivery_id, order_id, courier_name, awb_code, shipping_status, dispatched_at, updated_at, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, 'Shipped', NOW(), NOW(), NOW())
          ON CONFLICT (order_id) DO UPDATE SET
            courier_name = EXCLUDED.courier_name,
            awb_code = EXCLUDED.awb_code,
            shipping_status = EXCLUDED.shipping_status,
            dispatched_at = NOW(),
            updated_at = NOW()
        `, [orderId, srData.courier, srData.awb_code]);

        // Send notifications
        await sendOrderStatusNotifications(orderId, 'Shipped', client, srData.courier, srData.awb_code);

        await client.query('COMMIT');
        results.success++;
        results.details.push({ orderId, status: 'Success', courier: srData.courier });

      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Auto-Dispatch Error for Order ${orderId}:`, err.message);
        results.failed++;
        results.details.push({ orderId, status: 'Failed', error: "Shiprocket dispatch failed" });
      } finally {
        client.release();
      }
    }

    // 3. Log the bulk action
    await logAudit({
      admin_id: req.user.id,
      action: 'AUTO_DISPATCH_SHIPROCKET',
      table_name: 'orders',
      record_id: `Processed ${orderIds.length} orders`,
      details: results,
      req
    });

    return res.status(200).json({
      success: true,
      message: `Intelligent Auto-Pilot completed: ${results.success} success, ${results.failed} failed.`,
      summary: results
    });

  } catch (error) {
    console.error("AUTO DISPATCH GLOBAL ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to initiate auto-dispatch" });
  }
};

/**
 * Update Master Security Key
 */
export const updateMasterKey = async (req, res) => {
  try {
    const { newMasterKey } = req.body;

    if (!req.user || req.user.type !== 'super_admin') {
      return res.status(403).json({ success: false, message: "Unauthorized: Only Super Administrators can change the Master Key." });
    }

    if (!newMasterKey || newMasterKey.length < 8) {
      return res.status(400).json({ success: false, message: "Master Key must be at least 8 characters for security." });
    }

    const hashedKey = await bcrypt.hash(newMasterKey, 12);

    await pool.query(
      "UPDATE super_admins SET master_key = $1, updated_at = NOW()",
      [hashedKey]
    );

    await logAudit({
      admin_id: req.user.id,
      action: 'UPDATE_MASTER_KEY',
      table_name: 'super_admins',
      record_id: null,
      new_values: { detail: 'MASTER_SECURITY_KEY_ROTATED' },
      req
    });

    res.json({ success: true, message: "Master Security Key updated successfully." });
  } catch (error) {
    console.error("UPDATE MASTER KEY ERROR:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Update Admin Password (Self)
 */
export const updateAdminPasswordSelf = async (req, res) => {
  try {
    const { id, type } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new passwords are required." });
    }

    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
    }

    const table = type === 'super_admin' ? 'super_admins' : 'admins';
    const idCol = type === 'super_admin' ? 'super_admin_id' : 'admin_id';

    let result;
    if (type === 'super_admin') {
      result = await pool.query(`SELECT password_hash, name, email FROM super_admins WHERE super_admin_id = $1`, [id]);
    } else {
      result = await pool.query(`SELECT password_hash, name, email FROM admins WHERE admin_id = $1`, [id]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid current password" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      `UPDATE ${table} SET password_hash = $1, updated_at = NOW() WHERE ${idCol} = $2`,
      [newPasswordHash, id]
    );

    await logAudit({
      admin_id: id,
      action: 'UPDATE_OWN_PASSWORD',
      table_name: table,
      record_id: id,
      req
    });
    // Send notification to super admins
    await pool.query(
      `INSERT INTO notifications (notification_id, type, message, created_at, is_read) 
       VALUES (gen_random_uuid(), 'ADMIN_PASSWORD_CHANGED', $1, NOW(), false)`,
      [`Administrator ${user.name || 'Unknown'} (${user.email || 'Unknown'}) has changed their password.`]
    );

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("UPDATE PASSWORD SELF ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update password" });
  }
};

/**
 * Get Comprehensive System Audit Logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        al.*,
        COALESCE(a.name, sa.name, 'System') as actor_name,
        COALESCE(a.email, sa.email, 'system@gomo.com') as actor_email
      FROM audit_logs al
      LEFT JOIN admins a ON al.admin_id = a.admin_id
      LEFT JOIN super_admins sa ON al.admin_id = sa.super_admin_id
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);

    // Get total count for pagination metadata
    const countQuery = `SELECT COUNT(*) FROM audit_logs`;
    const countResult = await pool.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].count);

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("GET AUDIT LOGS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch audit logs" });
  }
};

/**
 * Orphaned Payments Endpoints
 */
export const getOrphanedPayments = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM orphaned_payments ORDER BY created_at DESC");
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("GET ORPHANED PAYMENTS ERROR:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const resolveOrphanedPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, order_id } = req.body;
        
        let status = 'Resolved';
        let notes = '';
        if (action === 'match') {
            status = 'Matched';
            notes = `Manually matched to order ${order_id}`;
        } else if (action === 'refund') {
            status = 'Refunded';
            notes = 'Manually refunded via admin action';
        }

        await pool.query(
            `UPDATE orphaned_payments 
             SET status = $1, notes = COALESCE(notes, '') || ' | ' || $2, matched_order_id = $3, resolved_at = NOW(), resolved_by = $4 
             WHERE payment_id = $5`,
            [status, notes, order_id || null, req.user.id, id]
        );

        return res.status(200).json({ success: true, message: `Orphaned payment successfully marked as ${status}` });
    } catch (error) {
        console.error("RESOLVE ORPHANED PAYMENT ERROR:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
