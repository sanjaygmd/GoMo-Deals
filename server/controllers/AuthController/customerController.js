import { pool } from "../../config/db.js";
import { generateOtp, hashOtp } from "../../utils/otp.js";
import { sendEmailOtp } from "../../utils/mailer.js";
import { createAuthSession, invalidateSession, cookieConfig, getCookieName, setSessionCookie } from "../../utils/authSession.js";
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sanitizeText } from "../../utils/sanitizer.js";
import { isPasswordStrong } from "../../utils/validation.js";


export const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Some fields are missing'
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const existingUser = await pool.query(
      "SELECT customer_id, full_name, email, phone, is_active, block_reason, password_hash, profile_picture_url, membership FROM customers WHERE email = $1", 
      [email]
    )
    if (existingUser.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    const user = existingUser.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: `Account Restricted: ${user.block_reason || 'Please contact support for assistance.'}`,
        block_reason: user.block_reason
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Create Auth Session
    const ip = req.ip || '0.0.0.0';
    const device = { agent: req.get('User-Agent') };
    const session = await createAuthSession(user.customer_id, 'customer', ip, device, { name: user.full_name, email: user.email });

    setSessionCookie(res, 'customer', session.token);

    return res.status(200).json({
      success: true,
      message: 'Logging in customer successful',
      data: {
        id: user.customer_id,
        role: 'customer',
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        profile_picture_url: user.profile_picture_url,
        membership: user.membership,
        sessionId: session.sessionId
      }
    })

  } catch (error) {
    console.error("CUSTOMER LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: 'Customer login failed'
    })
  }
}


export const registerCustomer = async (req, res) => {
  try {
    const { full_name, email, phone, date_of_birth, gender, profile_picture_url, password } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    if (full_name.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Full name must be at least 3 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: "Phone number must be 10 digits" });
    }

    if (!isPasswordStrong(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
      });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const existingUser = await pool.query(
      "SELECT customer_id FROM customers WHERE email = $1",
      [sanitizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Security Fix: Prevent direct API registration bypass by enforcing existing verified email OTP
    const otpVerificationCheck = await pool.query(
      "SELECT 1 FROM otp_verifications WHERE email = $1 AND purpose = 'customer_registration' AND is_verified = true",
      [sanitizedEmail]
    );
    if (otpVerificationCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Email verification is required before registration. Please verify your OTP first."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const sanitizedName = sanitizeText(full_name);

    const result = await pool.query(
      `INSERT INTO customers 
      (customer_id, full_name, email, phone, password_hash, date_of_birth, gender, profile_picture_url) 
      VALUES 
      (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
      RETURNING customer_id, full_name, email, phone, date_of_birth, gender, profile_picture_url`,
      [sanitizedName, sanitizedEmail, phone, passwordHash, date_of_birth || null, gender || null, profile_picture_url || null]
    );

    // Consume verified OTP record so it cannot be reused
    await pool.query(
      "DELETE FROM otp_verifications WHERE email = $1 AND purpose = 'customer_registration'",
      [sanitizedEmail]
    );

    // Create Auth Session automatically on register
    const ip = req.ip || '0.0.0.0';
    const device = { agent: req.get('User-Agent') };
    const session = await createAuthSession(result.rows[0].customer_id, 'customer', ip, device, { name: result.rows[0].full_name, email: result.rows[0].email });

    setSessionCookie(res, 'customer', session.token);

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: {
        id: result.rows[0].customer_id,
        name: result.rows[0].full_name,
        email: result.rows[0].email,
        phone: result.rows[0].phone,
        date_of_birth: result.rows[0].date_of_birth,
        gender: result.rows[0].gender,
        profile_picture_url: result.rows[0].profile_picture_url,
        sessionId: session.sessionId
      },
    });


  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Customer registration failed",
    });
  }
};

export const customerOnboarding = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      full_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      pincode,
      country,
      is_default,
    } = req.body;

    if (!address_line_1 || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // Ownership Check
    if (req.user.id !== id && req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const user = await pool.query(
      "SELECT full_name, phone FROM customers WHERE customer_id = $1",
      [id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingAddress = await pool.query(
      "SELECT address_id FROM addresses WHERE user_id = $1 AND user_type = 'customer'",
      [id]
    );

    let result;
    if (existingAddress.rows.length > 0) {
      result = await pool.query(
        `UPDATE addresses 
         SET full_name = $2, phone = $3, address_line_1 = $4, address_line_2 = $5, city = $6, state = $7, pincode = $8, country = $9, is_default = $10, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND user_type = 'customer'
         RETURNING *`,
        [
          id,
          sanitizeText(full_name),
          phone,
          sanitizeText(address_line_1),
          sanitizeText(address_line_2),
          sanitizeText(city),
          sanitizeText(state),
          pincode,
          sanitizeText(country),
          is_default ?? true,
        ]
      );
    } else {
      result = await pool.query(
        `INSERT INTO addresses 
        (address_id, user_id, user_type, full_name, phone, address_line_1, address_line_2, city, state, pincode, country, is_default)
        VALUES 
        (gen_random_uuid(), $1, 'customer', $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          id,
          sanitizeText(full_name),
          phone,
          sanitizeText(address_line_1),
          sanitizeText(address_line_2),
          sanitizeText(city),
          sanitizeText(state),
          pincode,
          sanitizeText(country),
          is_default ?? true,
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Customer onboarding failed",
    });
  }
};


export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Ownership Check
    if (req.user.id !== id && req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const user = await pool.query(
      "SELECT customer_id, full_name, email, phone, date_of_birth, gender, profile_picture_url, is_active, created_at FROM customers WHERE customer_id = $1",
      [id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Getting customer id is successful',
      data: user.rows[0]
    })
  } catch (error) {
    console.error("GET CUSTOMER BY ID ERROR:", error);
    return res.status(500).json({ success: false, message: 'Failed to get customer by id' });
  }
}


export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, name, phone, date_of_birth, gender, profile_picture_url, store_name, store_description } = req.body;

    // Ownership Check: User can only update themselves, or Admin can update anyone
    if (req.user.id !== id && req.user.type !== 'admin' && req.user.type !== 'super_admin') {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const userTypes = {
      customer: { table: 'customers', idCol: 'customer_id' },
      seller: { table: 'sellers', idCol: 'seller_id' },
      admin: { table: 'admins', idCol: 'admin_id' },
      super_admin: { table: 'super_admins', idCol: 'super_admin_id' }
    };

    // Determine target user type dynamically from live tables (never rely on potentially stale auth_sessions cache)
    let targetType;

    if (req.user.id === id) {
        targetType = req.user.type;
    } else {
        // Check tables sequentially to find actual user type from live tables
        const custCheck = await pool.query("SELECT customer_id FROM customers WHERE customer_id = $1", [id]);
        if (custCheck.rows.length > 0) {
            targetType = 'customer';
        } else {
            const sellerCheck = await pool.query("SELECT seller_id FROM sellers WHERE seller_id = $1", [id]);
            if (sellerCheck.rows.length > 0) {
                targetType = 'seller';
            } else {
                const adminCheck = await pool.query("SELECT admin_id FROM admins WHERE admin_id = $1", [id]);
                if (adminCheck.rows.length > 0) {
                    targetType = 'admin';
                } else {
                    const superAdminCheck = await pool.query("SELECT super_admin_id FROM super_admins WHERE super_admin_id = $1", [id]);
                    if (superAdminCheck.rows.length > 0) {
                        targetType = 'super_admin';
                    }
                }
            }
        }
    }

    const config = userTypes[targetType];
    if (!config) return res.status(400).json({ success: false, message: "Invalid user type for update" });

    try {
        const updates = [];
        const values = [];
        let index = 1;

        // Map frontend fields to DB columns based on table
        if (config.table === 'customers' || config.table === 'sellers') {
            if (full_name || name) {
                updates.push(`full_name = $${index++}`);
                values.push(full_name || name);
            }
        } else {
            // Admins/Super Admins use 'name' column
            if (name || full_name) {
                updates.push(`name = $${index++}`);
                values.push(name || full_name);
            }
        }

        if (phone) {
            updates.push(`phone = $${index++}`);
            values.push(phone);
        }
        
        // Fields specific to customers/sellers
        if (config.table === 'customers' || config.table === 'sellers') {
            if (date_of_birth !== undefined) {
                updates.push(`date_of_birth = $${index++}`);
                values.push(date_of_birth || null);
            }
            if (gender !== undefined) {
                updates.push(`gender = $${index++}`);
                values.push(gender || null);
            }
        }

        if (config.table === 'sellers') {
            if (store_name) {
                updates.push(`store_name = $${index++}`);
                values.push(store_name);
            }
            if (store_description) {
                updates.push(`store_description = $${index++}`);
                values.push(store_description);
            }
        }

        // Profile picture handling
        if (config.table === 'customers') {
            if (profile_picture_url !== undefined) {
                updates.push(`profile_picture_url = $${index++}`);
                values.push(profile_picture_url || null);
            }
        } else if (config.table === 'sellers') {
            if (profile_picture_url !== undefined) {
                updates.push(`store_logo = $${index++}`);
                values.push(profile_picture_url || null);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        
        const query = `UPDATE ${config.table} SET ${updates.join(', ')} WHERE ${config.idCol} = $${index} RETURNING *`;
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, message: "User not found in database" });
        }

        // Standardize response data for frontend AuthContext
        const updatedUser = result.rows[0];
        const formattedData = {
            id: updatedUser[config.idCol],
            name: updatedUser.full_name || updatedUser.name,
            full_name: updatedUser.full_name || updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: targetType,
            profile_picture_url: updatedUser.profile_picture_url || updatedUser.store_logo || null,
            ...(config.table === 'customers' && {
                date_of_birth: updatedUser.date_of_birth,
                gender: updatedUser.gender
            })
        };

        return res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          data: formattedData,
        });
    } catch (dbError) {
        console.error("DATABASE UPDATE ERROR:", dbError);
        return res.status(500).json({ success: false, message: "Database update failed" });
    }
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const getCustomerStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Ownership Check
    if (req.user.id !== id && req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const ordersCount = await pool.query("SELECT COUNT(*) FROM orders WHERE customer_id = $1", [id]);
    const cartCount = await pool.query("SELECT item_count FROM cart WHERE customer_id = $1", [id]);
    const wishlistCount = await pool.query("SELECT item_count FROM wishlist WHERE customer_id = $1", [id]);

    return res.status(200).json({
      success: true,
      data: {
        orders: parseInt(ordersCount.rows[0].count),
        cart: cartCount.rows[0]?.item_count || 0,
        wishlist: wishlistCount.rows[0]?.item_count || 0,
      }
    });
  } catch (error) {
    console.error("GET CUSTOMER STATS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to get customer stats" });
  }
};


export const getCustomerOrders = async (req, res) => {
  try {
    const { id } = req.params;

    // Ownership Check
    if (req.user.id !== id && req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const result = await pool.query(
      `SELECT * FROM orders WHERE customer_id = $1 ORDER BY placed_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("GET CUSTOMER ORDERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to get customer orders" });
  }
};


export const getCustomerAddresses = async (req, res) => {
  try {
    const { id } = req.params;

    // Ownership Check
    if (req.user.id !== id && req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const result = await pool.query(
      `SELECT * FROM addresses WHERE user_id = $1 AND user_type = 'customer' ORDER BY is_default DESC, created_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("GET CUSTOMER ADDRESSES ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to get customer addresses" });
  }
};

export const getMe = async (req, res) => {
  try {
    let result;
    switch (req.user.type) {
      case 'customer':
        result = await pool.query(`SELECT customer_id as id, full_name as name, email, phone, date_of_birth, gender, profile_picture_url, membership, has_agreed_to_flea_market_terms, is_active, created_at FROM customers WHERE customer_id = $1`, [req.user.id]);
        break;
      case 'seller':
        result = await pool.query(`SELECT seller_id as id, full_name as name, email, phone, store_name, gstin, store_logo, store_description, onboarding_completed, has_agreed_to_flea_market_terms, seller_subscription, seller_subscription_expiry, is_verified, is_active, created_at FROM sellers WHERE seller_id = $1`, [req.user.id]);
        break;
      case 'admin':
        result = await pool.query(`SELECT admin_id as id, name, email, role, is_active, created_at FROM admins WHERE admin_id = $1`, [req.user.id]);
        break;
      case 'super_admin':
        result = await pool.query(`SELECT super_admin_id as id, name, email, role, is_active, created_at FROM super_admins WHERE super_admin_id = $1`, [req.user.id]);
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid user type" });
    }

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });

    const userData = { ...result.rows[0], role: req.user.type, onboarding_completed: result.rows[0].onboarding_completed ?? true };
    return res.status(200).json({ success: true, data: userData });
  } catch (error) {
    console.error("GET ME ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch user profile" });
  }
};



export const logout = async (req, res) => {
  try {
    let sessionId = req.sessionId;

    if (!sessionId && req.cookies) {
      const token = req.cookies.customer_token || req.cookies.token;
      if (token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const sessionRes = await pool.query(
          "SELECT session_id FROM auth_sessions WHERE token_hash = $1 AND is_blacklisted = false",
          [tokenHash]
        );
        if (sessionRes.rows.length > 0) {
          sessionId = sessionRes.rows[0].session_id;
        }
      }
    }

    if (sessionId) {
      await invalidateSession(sessionId);
    }
    res.clearCookie('token', { path: '/' });
    res.clearCookie('admin_token', { path: '/' });
    res.clearCookie('seller_token', { path: '/' });
    res.clearCookie('customer_token', { path: '/' });
    res.clearCookie('super_admin_token', { path: '/' });
    return res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: 'Customer logout failed'
    });
  }
}


export const sendOTP = async (req, res) => {
  try {
    const { email, purpose, user_type } = req.body;
    const type = user_type || 'customer';

    // Security Fix: Prefix purpose with user_type namespace to completely segregate customer vs seller OTP domains
    const scopedPurpose = `${type}_${purpose || 'registration'}`;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check existence based on purpose
    let existingUser;
    if (type === 'seller') {
      existingUser = await pool.query(`SELECT seller_id FROM sellers WHERE email = $1`, [email]);
    } else {
      existingUser = await pool.query(`SELECT customer_id FROM customers WHERE email = $1`, [email]);
    }

    if (purpose === 'registration' && existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Email already registered" });
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

    await sendEmailOtp(email, otp);

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

    // Security Fix: Prefix purpose with user_type namespace to completely segregate customer vs seller OTP domains
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
      return res.status(404).json({ success: false, message: "OTP not found" });
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
    
    // Security Fix: Convert to Buffers and use timingSafeEqual to prevent side-channel timing attacks.
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

export const agreeToFleaMarketTerms = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type; // customer or seller
    if (userType === 'customer') {
      await pool.query("UPDATE customers SET has_agreed_to_flea_market_terms = TRUE WHERE customer_id = $1", [userId]);
    } else if (userType === 'seller') {
      await pool.query("UPDATE sellers SET has_agreed_to_flea_market_terms = TRUE WHERE seller_id = $1", [userId]);
    } else {
      return res.status(400).json({ success: false, message: "Invalid user type." });
    }
    return res.json({ success: true, message: "Terms agreement recorded successfully." });
  } catch (error) {
    console.error("AGREE TO TERMS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to record terms agreement" });
  }
};