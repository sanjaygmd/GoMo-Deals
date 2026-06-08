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
        'GEMINI_API_KEY',
        'MASTER_SECURITY_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ [CRITICAL ERROR] Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\nServer cannot start without these configurations. Please check your .env file.');
        process.exit(1);
    }

    if (process.env.MASTER_SECURITY_KEY && process.env.MASTER_SECURITY_KEY.length < 32) {
        console.error('❌ [CRITICAL ERROR] MASTER_SECURITY_KEY must be at least 32 characters long to ensure cryptographic security.');
        process.exit(1);
    }

    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️ [WARNING] GEMINI_API_KEY is missing. Chatbot AI features are disabled.');
    }

    console.log('✅ Environment variables validated.');
};
