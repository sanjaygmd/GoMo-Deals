import express from 'express';

const configRoutes = express.Router();

/**
 * IMPORTANT: These are fallback rates used when an external API is unavailable.
 * They are intentionally approximate — do NOT use them for financial calculations.
 * TODO: Integrate a live exchange-rate API (e.g., exchange-rate-api.com) and cache
 * results in Redis with a 1-hour TTL to serve accurate rates.
 */
const FALLBACK_RATES = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    AED: 0.044,
};

// In-memory cache for exchange rates (populated by a future live API call)
let cachedRates = null;
let cacheTimestamp = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

configRoutes.get('/currency-rates', async (req, res) => {
    // Return cached rates if still fresh
    if (cachedRates && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_TTL_MS) {
        return res.status(200).json({
            success: true,
            base: 'INR',
            rates: cachedRates,
            timestamp: new Date(cacheTimestamp).toISOString(),
            source: 'cache'
        });
    }

    // TODO: Replace this block with a real API call, e.g.:
    // const response = await fetch(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/INR`);
    // const data = await response.json();
    // cachedRates = data.conversion_rates;
    // cacheTimestamp = Date.now();

    // For now, serve fallback rates and flag them as approximate
    cachedRates = FALLBACK_RATES;
    cacheTimestamp = Date.now();

    res.status(200).json({
        success: true,
        base: 'INR',
        rates: cachedRates,
        timestamp: new Date(cacheTimestamp).toISOString(),
        source: 'fallback', // Frontend can display a note when source is 'fallback'
        warning: 'Exchange rates are approximate. Live API integration pending.'
    });
});

export default configRoutes;
