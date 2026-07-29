import { pool } from '../config/db.js';

// Admin: Create a new ranking competition
export const createCompetition = async (req, res) => {
    try {
        const { title, description, entry_fee, start_date, end_date } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }

        const query = `
            INSERT INTO ranking_competitions (title, description, entry_fee, start_date, end_date, status)
            VALUES ($1, $2, $3, $4, $5, 'open')
            RETURNING *;
        `;
        const values = [
            title, 
            description || null, 
            entry_fee || 0, 
            start_date || null, 
            end_date || null
        ];
        const result = await pool.query(query, values);

        // Notify all sellers about new competition
        const sellersRes = await pool.query('SELECT seller_id FROM sellers');
        for (const s of sellersRes.rows) {
            await pool.query(`
                INSERT INTO notifications (notification_id, seller_id, type, message, created_at, is_read)
                VALUES (gen_random_uuid(), $1, 'ranking_alert', $2, NOW(), false)
            `, [s.seller_id, `🏆 New Brand Ranking Competition Launched: "${title}"! Apply now to compete for Homepage Showcase placement.`]);
        }
        // Notify Admin
        await pool.query(`
            INSERT INTO notifications (notification_id, type, message, created_at, is_read)
            VALUES (gen_random_uuid(), 'admin_alert', $1, NOW(), false)
        `, [`🏆 Launched new Brand Ranking competition: "${title}".`]);

        res.status(201).json({ success: true, competition: result.rows[0], message: 'Ranking competition created successfully' });
    } catch (error) {
        console.error('Error in createCompetition:', error);
        res.status(500).json({ success: false, message: 'Failed to create competition' });
    }
};

// Admin: Get all competitions with applicants and vote counts
export const getAdminCompetitions = async (req, res) => {
    try {
        const compQuery = `
            SELECT rc.*, s.store_name AS winner_store_name, s.store_logo AS winner_store_logo
            FROM ranking_competitions rc
            LEFT JOIN sellers s ON rc.winner_seller_id = s.seller_id
            ORDER BY rc.created_at DESC;
        `;
        const compResult = await pool.query(compQuery);
        const competitions = compResult.rows;

        // For each competition, fetch applicants with their vote count
        for (let comp of competitions) {
            const appQuery = `
                SELECT ra.*, s.store_name, s.store_logo, s.store_description, s.full_name, s.email,
                       COALESCE(vc.vote_count, 0) AS vote_count
                FROM ranking_applications ra
                JOIN sellers s ON ra.seller_id = s.seller_id
                LEFT JOIN (
                    SELECT competition_id, seller_id, COUNT(*) AS vote_count
                    FROM ranking_votes
                    GROUP BY competition_id, seller_id
                ) vc ON ra.competition_id = vc.competition_id AND ra.seller_id = vc.seller_id
                WHERE ra.competition_id = $1
                ORDER BY COALESCE(vc.vote_count, 0) DESC, ra.applied_at ASC;
            `;
            const appResult = await pool.query(appQuery, [comp.competition_id]);
            comp.applicants = appResult.rows;
        }

        res.json({ success: true, competitions });
    } catch (error) {
        console.error('Error in getAdminCompetitions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch competitions' });
    }
};

// Public / Seller / Customer: Get open competitions with applicants and vote counts
export const getOpenCompetitions = async (req, res) => {
    try {
        const customerId = req.user && req.user.type === 'customer' ? req.user.id : null;
        const sellerId = req.user && req.user.type === 'seller' ? req.user.id : null;

        const compQuery = `
            SELECT * FROM ranking_competitions
            WHERE status IN ('open', 'active_showcase')
            ORDER BY created_at DESC;
        `;
        const compResult = await pool.query(compQuery);
        const competitions = compResult.rows;

        for (let comp of competitions) {
            const appQuery = `
                SELECT ra.*, s.store_name, s.store_logo, s.store_description,
                       COALESCE(vc.vote_count, 0) AS vote_count
                FROM ranking_applications ra
                JOIN sellers s ON ra.seller_id = s.seller_id
                LEFT JOIN (
                    SELECT competition_id, seller_id, COUNT(*) AS vote_count
                    FROM ranking_votes
                    GROUP BY competition_id, seller_id
                ) vc ON ra.competition_id = vc.competition_id AND ra.seller_id = vc.seller_id
                WHERE ra.competition_id = $1 AND ra.payment_status = 'paid'
                ORDER BY COALESCE(vc.vote_count, 0) DESC, ra.applied_at ASC;
            `;
            const appResult = await pool.query(appQuery, [comp.competition_id]);
            comp.applicants = appResult.rows;

            // Check if logged in customer has voted in this competition
            if (customerId) {
                const voteQuery = `SELECT seller_id FROM ranking_votes WHERE competition_id = $1 AND customer_id = $2`;
                const voteResult = await pool.query(voteQuery, [comp.competition_id, customerId]);
                comp.user_voted_seller_id = voteResult.rows.length > 0 ? voteResult.rows[0].seller_id : null;
            }

            // Check if logged in seller has applied for this competition
            if (sellerId) {
                const myApp = comp.applicants.find(a => a.seller_id === sellerId);
                comp.my_application = myApp || null;
            }
        }

        res.json({ success: true, competitions });
    } catch (error) {
        console.error('Error in getOpenCompetitions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch open competitions' });
    }
};

// Seller: Apply and pay participation fee
export const applyForCompetition = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const { competition_id } = req.body;

        if (!competition_id) {
            return res.status(400).json({ success: false, message: 'Competition ID is required' });
        }

        // Check if competition exists and is open
        const compRes = await pool.query('SELECT * FROM ranking_competitions WHERE competition_id = $1', [competition_id]);
        if (compRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Competition not found' });
        }
        const comp = compRes.rows[0];
        if (comp.status !== 'open') {
            return res.status(400).json({ success: false, message: 'Competition is not open for applications' });
        }

        // Check if already applied
        const existRes = await pool.query('SELECT * FROM ranking_applications WHERE competition_id = $1 AND seller_id = $2', [competition_id, sellerId]);
        if (existRes.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'You have already applied for this competition' });
        }

        // Simulate instant payment
        const paymentRef = 'SIM_RANK_' + Math.random().toString(36).substring(2, 10).toUpperCase();

        const insertQuery = `
            INSERT INTO ranking_applications (competition_id, seller_id, payment_status, payment_amount, payment_reference, status)
            VALUES ($1, $2, 'paid', $3, $4, 'applied')
            RETURNING *;
        `;
        const result = await pool.query(insertQuery, [competition_id, sellerId, comp.entry_fee, paymentRef]);

        // Notify seller
        await pool.query(`
            INSERT INTO notifications (notification_id, seller_id, type, message, created_at, is_read)
            VALUES (gen_random_uuid(), $1, 'ranking_alert', $2, NOW(), false)
        `, [sellerId, `⚡ Participation confirmed for "${comp.title}"! Your fee of $${comp.entry_fee} was processed.`]);

        // Notify Admin
        const storeRes = await pool.query('SELECT store_name FROM sellers WHERE seller_id = $1', [sellerId]);
        const storeName = storeRes.rows[0]?.store_name || 'A seller';
        await pool.query(`
            INSERT INTO notifications (notification_id, type, message, created_at, is_read)
            VALUES (gen_random_uuid(), 'admin_alert', $1, NOW(), false)
        `, [`⚡ "${storeName}" applied and paid fee ($${comp.entry_fee}) for Brand Ranking: "${comp.title}".`]);

        res.status(201).json({ 
            success: true, 
            application: result.rows[0], 
            message: `Successfully applied and paid participation fee ($${comp.entry_fee})` 
        });
    } catch (error) {
        console.error('Error in applyForCompetition:', error);
        res.status(500).json({ success: false, message: 'Failed to submit application' });
    }
};

// Customer: Vote for a participating brand
export const voteForBrand = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { competition_id, seller_id } = req.body;

        if (!competition_id || !seller_id) {
            return res.status(400).json({ success: false, message: 'Competition ID and Seller ID are required' });
        }

        // Check if customer already voted in this competition
        const checkVote = await pool.query('SELECT * FROM ranking_votes WHERE competition_id = $1 AND customer_id = $2', [competition_id, customerId]);
        if (checkVote.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'You have already voted in this competition!' });
        }

        // Insert vote
        await pool.query(
            'INSERT INTO ranking_votes (competition_id, seller_id, customer_id) VALUES ($1, $2, $3)',
            [competition_id, seller_id, customerId]
        );

        res.json({ success: true, message: 'Your vote has been recorded! Thank you for supporting your favorite brand.' });
    } catch (error) {
        console.error('Error in voteForBrand:', error);
        res.status(500).json({ success: false, message: 'Failed to record vote' });
    }
};

// Admin: Select winning brand for homepage display
export const selectWinner = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { competition_id, winner_seller_id } = req.body;

        if (!competition_id || !winner_seller_id) {
            return res.status(400).json({ success: false, message: 'Competition ID and Winner Seller ID are required' });
        }

        // Update competition
        await client.query(
            "UPDATE ranking_competitions SET winner_seller_id = $1, status = 'active_showcase' WHERE competition_id = $2",
            [winner_seller_id, competition_id]
        );

        // Update applications status
        await client.query(
            "UPDATE ranking_applications SET status = 'winner' WHERE competition_id = $1 AND seller_id = $2",
            [competition_id, winner_seller_id]
        );
        await client.query(
            "UPDATE ranking_applications SET status = 'rejected' WHERE competition_id = $1 AND seller_id != $2 AND status = 'applied'",
            [competition_id, winner_seller_id]
        );

        // Get winner store name and competition title
        const compTitleRes = await client.query('SELECT title FROM ranking_competitions WHERE competition_id = $1', [competition_id]);
        const compTitle = compTitleRes.rows[0]?.title || 'Brand Ranking';
        const storeRes = await client.query('SELECT store_name FROM sellers WHERE seller_id = $1', [winner_seller_id]);
        const winnerName = storeRes.rows[0]?.store_name || 'A brand';

        // Notify winning seller
        await client.query(`
            INSERT INTO notifications (notification_id, seller_id, type, message, created_at, is_read)
            VALUES (gen_random_uuid(), $1, 'ranking_alert', $2, NOW(), false)
        `, [winner_seller_id, `🎉 CONGRATULATIONS! Your store was crowned WINNER of "${compTitle}" and is now showcased live on the Homepage!`]);

        // Notify all other sellers
        const otherSellersRes = await client.query('SELECT seller_id FROM sellers WHERE seller_id != $1', [winner_seller_id]);
        for (const s of otherSellersRes.rows) {
            await client.query(`
                INSERT INTO notifications (notification_id, seller_id, type, message, created_at, is_read)
                VALUES (gen_random_uuid(), $1, 'ranking_alert', $2, NOW(), false)
            `, [s.seller_id, `🏆 Brand Ranking update: "${winnerName}" won the showcase for "${compTitle}".`]);
        }

        // Notify Admin
        await client.query(`
            INSERT INTO notifications (notification_id, type, message, created_at, is_read)
            VALUES (gen_random_uuid(), 'admin_alert', $1, NOW(), false)
        `, [`🏆 Declared "${winnerName}" as the Homepage Showcase winner for "${compTitle}".`]);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Winner declared successfully! This brand will now be showcased on the homepage.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in selectWinner:', error);
        res.status(500).json({ success: false, message: 'Failed to declare winner' });
    } finally {
        client.release();
    }
};

// Public: Get currently active showcased winning brand and their top products
export const getActiveShowcase = async (req, res) => {
    try {
        const compQuery = `
            SELECT rc.*, s.store_name, s.store_logo, s.store_description, s.seller_id
            FROM ranking_competitions rc
            JOIN sellers s ON rc.winner_seller_id = s.seller_id
            WHERE rc.status = 'active_showcase' AND rc.winner_seller_id IS NOT NULL
            ORDER BY rc.created_at DESC
            LIMIT 1;
        `;
        const compResult = await pool.query(compQuery);
        if (compResult.rows.length === 0) {
            return res.json({ success: true, showcase: null });
        }

        const showcase = compResult.rows[0];

        // Get total vote count for this winner
        const voteRes = await pool.query(
            'SELECT COUNT(*) AS total_votes FROM ranking_votes WHERE competition_id = $1 AND seller_id = $2',
            [showcase.competition_id, showcase.seller_id]
        );
        showcase.total_votes = voteRes.rows[0].total_votes || 0;

        // Fetch top 4 active products of this winning seller
        const prodQuery = `
            SELECT product_id, name, price, mrp, images, slug, discount_percent, brand
            FROM products
            WHERE seller_id = $1 AND is_active = true
            ORDER BY created_at DESC
            LIMIT 4;
        `;
        const prodResult = await pool.query(prodQuery, [showcase.seller_id]);
        showcase.products = prodResult.rows;

        res.json({ success: true, showcase });
    } catch (error) {
        console.error('Error in getActiveShowcase:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch active showcase' });
    }
};

// Admin: Update a ranking competition
export const updateCompetition = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, entry_fee, participation_fee, start_date, end_date, status } = req.body;
        const fee = entry_fee !== undefined ? entry_fee : (participation_fee !== undefined ? participation_fee : null);
        const query = `
            UPDATE ranking_competitions
            SET title = COALESCE($1, title),
                description = COALESCE($2, description),
                entry_fee = COALESCE($3, entry_fee),
                start_date = COALESCE($4, start_date),
                end_date = COALESCE($5, end_date),
                status = COALESCE($6, status)
            WHERE competition_id = $7
            RETURNING *;
        `;
        const values = [
            title || null, 
            description || null, 
            fee !== null ? fee : null, 
            start_date || null, 
            end_date || null, 
            status || null, 
            id
        ];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Competition not found' });
        }
        res.json({ success: true, competition: result.rows[0], message: 'Competition updated successfully' });
    } catch (error) {
        console.error('Error in updateCompetition:', error);
        res.status(500).json({ success: false, message: 'Failed to update competition' });
    }
};

// Admin: Delete a ranking competition (with automatic fee refund for paid sellers)
export const deleteCompetition = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');

        // Check if competition exists and get details
        const compRes = await client.query('SELECT title, entry_fee FROM ranking_competitions WHERE competition_id = $1', [id]);
        if (compRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Competition not found' });
        }
        const compTitle = compRes.rows[0].title || 'Brand Ranking Competition';
        const defaultFee = parseFloat(compRes.rows[0].entry_fee || 0);

        // Find all paid seller applications that need refunding
        const paidAppsRes = await client.query(
            "SELECT * FROM ranking_applications WHERE competition_id = $1 AND payment_status = 'paid'", 
            [id]
        );

        let refundedCount = 0;
        let totalRefunded = 0;

        for (const app of paidAppsRes.rows) {
            const refundAmount = parseFloat(app.payment_amount || defaultFee || 0);
            if (refundAmount > 0) {
                refundedCount++;
                totalRefunded += refundAmount;
                const refundRef = 'REF_' + (app.payment_reference || Math.random().toString(36).substring(2, 8).toUpperCase());

                // 1. Record in seller_payouts so seller sees it in their Payout & Transaction History
                await client.query(`
                    INSERT INTO seller_payouts (payout_id, seller_id, amount, status, notes, transaction_ref, payment_method, completed_at, created_at)
                    VALUES (gen_random_uuid(), $1, $2, 'Refunded', $3, $4, 'Fee Refund', NOW(), NOW())
                `, [app.seller_id, refundAmount, `Refund for cancelled ranking event: "${compTitle}"`, refundRef]);

                // 2. Record in platform finance_transactions
                await client.query(`
                    INSERT INTO finance_transactions (finance_transactions_id, transaction_type, amount, created_at)
                    VALUES (gen_random_uuid(), $1, $2, NOW())
                `, [`Brand Ranking Fee Refund: ${compTitle}`, refundAmount]);

                // 3. Notify Seller with high priority alert
                await client.query(`
                    INSERT INTO notifications (notification_id, seller_id, type, message, created_at, is_read)
                    VALUES (gen_random_uuid(), $1, 'ranking_alert', $2, NOW(), false)
                `, [app.seller_id, `💰 REFUND PROCESSED: The Brand Ranking event "${compTitle}" was deleted by Admin. Your participation fee of $${refundAmount} has been automatically refunded (Ref: ${refundRef}).`]);

                // 4. Notify Admin
                await client.query(`
                    INSERT INTO notifications (notification_id, type, message, created_at, is_read)
                    VALUES (gen_random_uuid(), 'admin_alert', $1, NOW(), false)
                `, [`💰 Processed automatic refund of $${refundAmount} to Seller ID ${app.seller_id} for deleted ranking event "${compTitle}".`]);
            }
        }

        // Clean up votes, applications, and the competition itself
        await client.query('DELETE FROM ranking_votes WHERE competition_id = $1', [id]);
        await client.query('DELETE FROM ranking_applications WHERE competition_id = $1', [id]);
        await client.query('DELETE FROM ranking_competitions WHERE competition_id = $1', [id]);
        await client.query('COMMIT');

        const msg = refundedCount > 0 
            ? `Competition deleted. Automatically processed $${totalRefunded} in refunds to ${refundedCount} participating brand(s).`
            : 'Competition deleted successfully';

        res.json({ 
            success: true, 
            message: msg, 
            refunded_count: refundedCount, 
            total_refunded: totalRefunded 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in deleteCompetition:', error);
        res.status(500).json({ success: false, message: 'Failed to delete competition' });
    } finally {
        client.release();
    }
};
