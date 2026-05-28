/**
 * Validates that all required environment variables are present.
 * Prevents the server from starting in a partially configured state.
 */
export const validateEnv = () => {
    const required = [
        'DATABASE_URL',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'RAZORPAY_WEBHOOK_SECRET',
        'GEMINI_API_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ [CRITICAL ERROR] Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\nServer cannot start without these configurations. Please check your .env file.');
        process.exit(1);
    }

    console.log('✅ Environment variables validated.');
};
