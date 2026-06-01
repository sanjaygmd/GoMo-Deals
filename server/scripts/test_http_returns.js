import dotenv from 'dotenv';
import pg from 'pg';
import crypto from 'crypto';
import axios from 'axios';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        // Generate a random token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        
        // Insert a temporary session for our admin user
        const adminId = 'f80202e4-6cc7-44c0-b2b9-03aa09ff8461'; // Sanjay admin
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        
        await pool.query(`
            INSERT INTO auth_sessions (session_id, user_ref_id, user_type, token_hash, last_ip, last_device, last_accessed, expires_at, created_at, user_profile)
            VALUES (gen_random_uuid(), $1, 'admin', $2, '127.0.0.1', '{}'::jsonb, NOW(), $3, NOW(), '{"email": "sanjaygmd01@gmail.com", "name": "Sanjay admin"}'::jsonb)
        `, [adminId, tokenHash, expiresAt]);
        
        console.log("Successfully created temporary admin session.");
        
        // Make the HTTP request to the running server
        console.log("Making GET request to /api/admin/returns...");
        const response = await axios.get('http://localhost:3000/api/admin/returns', {
            headers: {
                'Authorization': `Bearer ${rawToken}`,
                'X-GoMo-Protection': 'active'
            }
        });
        
        console.log("HTTP Response Status:", response.status);
        console.log("HTTP Response Body:", JSON.stringify(response.data, null, 2));
        
    } catch (err) {
        if (err.response) {
            console.error("HTTP Error Response Status:", err.response.status);
            console.error("HTTP Error Response Body:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.error("Error making request:", err);
        }
    } finally {
        await pool.end();
    }
}
main();
