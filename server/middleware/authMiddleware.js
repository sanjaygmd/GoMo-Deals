import crypto from 'crypto';
import { pool } from '../config/db.js';



/**
 * Middleware to verify session token and check roles
 */
export const requireAuth = (allowedRoles = []) => async (req, res, next) => {
    try {
        const tokens = [];
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            tokens.push(authHeader.split(' ')[1]);
        }
        
        if (req.cookies) {
            if (req.cookies.admin_token) tokens.push(req.cookies.admin_token);
            if (req.cookies.super_admin_token) tokens.push(req.cookies.super_admin_token);
            if (req.cookies.seller_token) tokens.push(req.cookies.seller_token);
            if (req.cookies.customer_token) tokens.push(req.cookies.customer_token);
            if (req.cookies.token) tokens.push(req.cookies.token);
        }

        const uniqueTokens = [...new Set(tokens)].filter(Boolean);

        if (uniqueTokens.length === 0) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const tokenHashes = uniqueTokens.map(t => crypto.createHash('sha256').update(t).digest('hex'));

        const result = await pool.query(`
            SELECT s.* 
            FROM auth_sessions s 
            WHERE s.token_hash = ANY($1) 
            AND s.expires_at > NOW()
            AND s.last_accessed > NOW() - INTERVAL '2 hours'
        `, [tokenHashes]);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }

        // Deterministically prioritize roles: super_admin > admin > seller > customer
        const rolePriority = {
            'super_admin': 4,
            'admin': 3,
            'seller': 2,
            'customer': 1
        };
        const sortedSessions = [...result.rows].sort((a, b) => {
            const priorityA = rolePriority[a.user_type] || 0;
            const priorityB = rolePriority[b.user_type] || 0;
            return priorityB - priorityA;
        });

        let session = null;
        if (allowedRoles.length > 0) {
            session = sortedSessions.find(r => allowedRoles.includes(r.user_type));
            if (!session) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Insufficient permissions'
                });
            }
        } else {
            session = sortedSessions[0];
        }

        const profile = session.user_profile || {};
        const user = {
            id: session.user_ref_id,
            type: session.user_type,
            get email() {
                return profile.email || `user-${session.user_ref_id.slice(0, 8)}@market.internal`;
            },
            get name() {
                return profile.name || 'Authenticated User';
            }
        };

        req.user = user;
        req.sessionId = session.session_id;

        // Update last accessed only if more than 5 minutes have passed
        if (new Date() - new Date(session.last_accessed) > 5 * 60 * 1000) {
            await pool.query("UPDATE auth_sessions SET last_accessed = NOW() WHERE session_id = $1", [session.session_id]);
        }

        next();
    } catch (error) {
        console.error("AUTH MIDDLEWARE ERROR:", error);
        return res.status(500).json({ success: false, message: 'Authentication error' });
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        const tokens = [];
        if (req.cookies) {
            if (req.cookies.token) tokens.push(req.cookies.token);
            if (req.cookies.customer_token) tokens.push(req.cookies.customer_token);
        }

        const uniqueTokens = [...new Set(tokens)].filter(Boolean);
        if (uniqueTokens.length === 0) return next();

        const tokenHashes = uniqueTokens.map(t => crypto.createHash('sha256').update(t).digest('hex'));
        const result = await pool.query(`
            SELECT user_ref_id, user_type, session_id, user_profile 
            FROM auth_sessions 
            WHERE token_hash = ANY($1) 
            AND expires_at > NOW()
            AND last_accessed > NOW() - INTERVAL '2 hours'
            LIMIT 1
        `, [tokenHashes]);

        if (result.rows.length > 0) {
            const session = result.rows[0];
            const profile = session.user_profile || {};
            req.user = {
                id: session.user_ref_id,
                type: session.user_type,
                get email() {
                    return profile.email || `user-${session.user_ref_id.slice(0, 8)}@market.internal`;
                },
                get name() {
                    return profile.name || 'Authenticated User';
                }
            };
            req.sessionId = session.session_id;

            // Update last accessed only if more than 5 minutes have passed
            if (new Date() - new Date(session.last_accessed) > 5 * 60 * 1000) {
                await pool.query("UPDATE auth_sessions SET last_accessed = NOW() WHERE session_id = $1", [session.session_id]);
            }
        }
        next();
    } catch (error) {
        next();
    }
};