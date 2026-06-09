import { pool } from '../config/db.js';

// GET /api/v1/questions/product/:product_id
export const getProductQuestions = async (req, res) => {
    try {
        const { product_id } = req.params;
        const customer_id = req.user?.id || null;
        
        let queryStr;
        let queryParams;

        if (customer_id) {
            queryStr = `
                SELECT pq.question_id, pq.question, pq.answer, pq.created_at, pq.updated_at, pq.status, c.full_name as customer_name
                FROM product_questions pq
                JOIN customers c ON pq.customer_id = c.customer_id
                WHERE pq.product_id = $1 AND (pq.status = 'answered' OR pq.customer_id = $2)
                ORDER BY pq.updated_at DESC
            `;
            queryParams = [product_id, customer_id];
        } else {
            queryStr = `
                SELECT pq.question_id, pq.question, pq.answer, pq.created_at, pq.updated_at, pq.status, c.full_name as customer_name
                FROM product_questions pq
                JOIN customers c ON pq.customer_id = c.customer_id
                WHERE pq.product_id = $1 AND pq.status = 'answered'
                ORDER BY pq.updated_at DESC
            `;
            queryParams = [product_id];
        }

        const result = await pool.query(queryStr, queryParams);

        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('GET PRODUCT QUESTIONS ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch questions' });
    }
};

// POST /api/v1/questions/ask
export const askQuestion = async (req, res) => {
    try {
        const { id: customer_id } = req.user;
        const { product_id, question } = req.body;

        if (!product_id || !question || question.trim() === '') {
            return res.status(400).json({ success: false, message: 'Product ID and question are required' });
        }

        // Get seller_id for the product
        const productRes = await pool.query('SELECT seller_id FROM products WHERE product_id = $1', [product_id]);
        if (productRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        const seller_id = productRes.rows[0].seller_id;

        const result = await pool.query(`
            INSERT INTO product_questions (product_id, customer_id, seller_id, question)
            VALUES ($1, $2, $3, $4)
            RETURNING question_id, created_at
        `, [product_id, customer_id, seller_id, question.trim()]);

        return res.status(201).json({ 
            success: true, 
            message: 'Question submitted successfully. Waiting for seller response.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('ASK QUESTION ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to submit question' });
    }
};

// GET /api/v1/questions/seller
export const getSellerQuestions = async (req, res) => {
    try {
        const { id: seller_id } = req.user;
        
        const result = await pool.query(`
            SELECT pq.question_id, pq.question, pq.answer, pq.status, pq.created_at, p.name as product_name, p.product_id
            FROM product_questions pq
            JOIN products p ON pq.product_id = p.product_id
            WHERE pq.seller_id = $1
            ORDER BY 
                CASE WHEN pq.status = 'pending' THEN 1 ELSE 2 END,
                pq.created_at DESC
        `, [seller_id]);

        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('GET SELLER QUESTIONS ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch seller questions' });
    }
};

// POST /api/v1/questions/answer
export const answerQuestion = async (req, res) => {
    try {
        const { id: seller_id } = req.user;
        const { question_id, answer, action } = req.body;

        if (!question_id || !action || !['answer', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid request' });
        }

        if (action === 'answer' && (!answer || answer.trim() === '')) {
            return res.status(400).json({ success: false, message: 'Answer is required' });
        }

        // Verify ownership
        const ownershipCheck = await pool.query('SELECT seller_id FROM product_questions WHERE question_id = $1', [question_id]);
        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }
        if (ownershipCheck.rows[0].seller_id !== seller_id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const status = action === 'answer' ? 'answered' : 'rejected';
        const finalAnswer = action === 'answer' ? answer.trim() : null;

        await pool.query(`
            UPDATE product_questions
            SET answer = $1, status = $2, updated_at = NOW()
            WHERE question_id = $3
        `, [finalAnswer, status, question_id]);

        return res.status(200).json({ success: true, message: `Question ${status} successfully` });
    } catch (error) {
        console.error('ANSWER QUESTION ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to process question' });
    }
};
