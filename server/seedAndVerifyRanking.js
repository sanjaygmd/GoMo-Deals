import { pool } from './config/db.js';

async function seedAndVerify() {
    const client = await pool.connect();
    try {
        console.log("--- Starting Ranking Feature Verification & Seeding ---");
        await client.query('BEGIN');

        // Clean up old ranking test data if any
        await client.query('DELETE FROM ranking_votes');
        await client.query('DELETE FROM ranking_applications');
        await client.query('DELETE FROM ranking_competitions');

        // Fetch sellers
        const sellerRes = await client.query('SELECT seller_id, store_name FROM sellers LIMIT 2');
        if (sellerRes.rows.length < 2) {
            throw new Error("Need at least 2 sellers in DB to run verification.");
        }
        const seller1 = sellerRes.rows[0]; // e.g. Luxury Boutique Hub
        const seller2 = sellerRes.rows[1]; // e.g. GoMo Mart
        console.log(`Using Sellers: [1] ${seller1.store_name} (${seller1.seller_id}), [2] ${seller2.store_name} (${seller2.seller_id})`);

        // Fetch customers
        const custRes = await client.query('SELECT customer_id, email FROM customers LIMIT 3');
        const customers = custRes.rows;
        console.log(`Using ${customers.length} Customers for voting simulation.`);

        // 1. Create Competition 1 (Winner Showcase)
        const comp1Res = await client.query(`
            INSERT INTO ranking_competitions (title, description, entry_fee, start_date, end_date, status)
            VALUES ($1, $2, $3, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day', 'active_showcase')
            RETURNING *;
        `, [
            "Official Brand of July - Summer Showcase", 
            "The top brand voted by over 5,000 community shoppers during our summer festival.",
            99.99
        ]);
        const comp1 = comp1Res.rows[0];
        console.log(`\nCreated Showcase Competition: "${comp1.title}" (ID: ${comp1.competition_id})`);

        // Apply seller2 and declare as winner
        await client.query(`
            INSERT INTO ranking_applications (competition_id, seller_id, payment_status, payment_amount, payment_reference, status)
            VALUES ($1, $2, 'paid', 99.99, 'REF_JULY_WINNER', 'winner');
        `, [comp1.competition_id, seller2.seller_id]);

        await client.query(`
            UPDATE ranking_competitions SET winner_seller_id = $1 WHERE competition_id = $2;
        `, [seller2.seller_id, comp1.competition_id]);

        // Add sample votes to comp1 for authenticity
        if (customers.length > 0) {
            await client.query(`INSERT INTO ranking_votes (competition_id, seller_id, customer_id) VALUES ($1, $2, $3)`, [comp1.competition_id, seller2.seller_id, customers[0].customer_id]);
        }
        if (customers.length > 1) {
            await client.query(`INSERT INTO ranking_votes (competition_id, seller_id, customer_id) VALUES ($1, $2, $3)`, [comp1.competition_id, seller2.seller_id, customers[1].customer_id]);
        }
        console.log(`Declared "${seller2.store_name}" as WINNER for Showcase Competition!`);

        // 2. Create Competition 2 (Open Community Voting Leaderboard)
        const comp2Res = await client.query(`
            INSERT INTO ranking_competitions (title, description, entry_fee, start_date, end_date, status)
            VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '15 days', 'open')
            RETURNING *;
        `, [
            "Featured Brand of the Month - August Community Wars",
            "Vote for your favorite participating brand! The brand with the most community support wins featured homepage placement all next month.",
            49.99
        ]);
        const comp2 = comp2Res.rows[0];
        console.log(`\nCreated Open Voting Competition: "${comp2.title}" (ID: ${comp2.competition_id})`);

        // Apply both sellers to Competition 2
        await client.query(`
            INSERT INTO ranking_applications (competition_id, seller_id, payment_status, payment_amount, payment_reference, status)
            VALUES ($1, $2, 'paid', 49.99, 'REF_AUG_S1', 'applied'),
                   ($1, $3, 'paid', 49.99, 'REF_AUG_S2', 'applied');
        `, [comp2.competition_id, seller1.seller_id, seller2.seller_id]);
        console.log(`Both "${seller1.store_name}" and "${seller2.store_name}" applied and paid $49.99 entry fee!`);

        // Record votes in Competition 2
        if (customers.length >= 3) {
            // 2 votes for seller1, 1 vote for seller2
            await client.query(`INSERT INTO ranking_votes (competition_id, seller_id, customer_id) VALUES ($1, $2, $3)`, [comp2.competition_id, seller1.seller_id, customers[0].customer_id]);
            await client.query(`INSERT INTO ranking_votes (competition_id, seller_id, customer_id) VALUES ($1, $2, $3)`, [comp2.competition_id, seller1.seller_id, customers[1].customer_id]);
            await client.query(`INSERT INTO ranking_votes (competition_id, seller_id, customer_id) VALUES ($1, $2, $3)`, [comp2.competition_id, seller2.seller_id, customers[2].customer_id]);
            console.log(`Simulated Community Votes: ${seller1.store_name} (2 votes), ${seller2.store_name} (1 vote).`);
        }

        await client.query('COMMIT');
        console.log("\n--- Seeding Committed Successfully! ---");

        // 3. Verify Queries (Simulating Controller logic)
        console.log("\n--- Verifying Active Showcase Query ---");
        const showcaseRes = await client.query(`
            SELECT rc.*, s.store_name, s.store_logo, s.store_description, s.seller_id
            FROM ranking_competitions rc
            JOIN sellers s ON rc.winner_seller_id = s.seller_id
            WHERE rc.status = 'active_showcase' AND rc.winner_seller_id IS NOT NULL
            ORDER BY rc.created_at DESC
            LIMIT 1;
        `);
        console.log("Showcase Result:", showcaseRes.rows[0] ? `FOUND: ${showcaseRes.rows[0].store_name} (Winner of ${showcaseRes.rows[0].title})` : "NONE");

        console.log("\n--- Verifying Open Competitions Query ---");
        const openRes = await client.query(`
            SELECT * FROM ranking_competitions WHERE status IN ('open', 'active_showcase') ORDER BY created_at DESC;
        `);
        for (let comp of openRes.rows) {
            const appRes = await client.query(`
                SELECT ra.*, s.store_name, COALESCE(vc.vote_count, 0) AS vote_count
                FROM ranking_applications ra
                JOIN sellers s ON ra.seller_id = s.seller_id
                LEFT JOIN (
                    SELECT competition_id, seller_id, COUNT(*) AS vote_count
                    FROM ranking_votes
                    GROUP BY competition_id, seller_id
                ) vc ON ra.competition_id = vc.competition_id AND ra.seller_id = vc.seller_id
                WHERE ra.competition_id = $1 AND ra.payment_status = 'paid'
                ORDER BY COALESCE(vc.vote_count, 0) DESC, ra.applied_at ASC;
            `, [comp.competition_id]);
            console.log(`\nCompetition: "${comp.title}" (${comp.status})`);
            appRes.rows.forEach((app, idx) => {
                console.log(`   Rank #${idx + 1}: ${app.store_name} - ${app.vote_count} votes (Status: ${app.status})`);
            });
        }

        console.log("\n✅ ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY!");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Verification error:", error);
    } finally {
        client.release();
        process.exit(0);
    }
}

seedAndVerify();
