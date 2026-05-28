import crypto from 'crypto';
import { pool } from '../config/db.js';

export const createAuthSession = async (userId, userType, ip, device, profile = {}) => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days max life

  const result = await pool.query(
    `INSERT INTO auth_sessions (user_ref_id, user_type, token_hash, expires_at, last_ip, last_device, last_accessed, user_profile)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
     RETURNING session_id`,
    [userId, userType, tokenHash, expiresAt, ip, JSON.stringify(device), JSON.stringify(profile)]
  );

  return {
    token,
    sessionId: result.rows[0].session_id,
    expiresAt
  };
};

export const invalidateSession = async (sessionId) => {
  await pool.query(
    'DELETE FROM auth_sessions WHERE session_id = $1',
    [sessionId]
  );
};

export const getCookieName = (userType) => {
  if (userType === 'admin' || userType === 'super_admin') return 'admin_token';
  if (userType === 'seller') return 'seller_token';
  if (userType === 'customer') return 'customer_token';
  return 'token';
};

const isProd = process.env.NODE_ENV === 'production';

export const cookieConfig = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Sets the role-specific session cookie and clears the generic 'token' cookie
 */
export const setSessionCookie = (res, userType, token) => {
  const name = getCookieName(userType);
  
  // Clear all potential role cookies to prevent mutually exclusive session pollution
  const clearOptions = { 
    path: '/', 
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  };
  res.clearCookie('token', clearOptions);
  res.clearCookie('customer_token', clearOptions);
  res.clearCookie('seller_token', clearOptions);
  res.clearCookie('admin_token', clearOptions);
  res.clearCookie('super_admin_token', clearOptions);
  
  res.cookie(name, token, cookieConfig);
};
