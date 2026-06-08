import express from 'express';

const configRoutes = express.Router();

const MOCK_RATES = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    AED: 0.044,
};

configRoutes.get('/currency-rates', (req, res) => {
    // In a real app, you would fetch this from an external API (like exchange-rate-api)
    // and cache it in Redis.
    res.status(200).json({
        success: true,
        base: 'INR',
        rates: MOCK_RATES,
        timestamp: new Date().toISOString()
    });
});

export default configRoutes;
