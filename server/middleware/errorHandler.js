/**
 * Centralized Error Handling Middleware.
 * Provides structured JSON logging and sanitizes error messages for production.
 */
export const errorHandler = (err, req, res, next) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Structured Logging for production (could be expanded to use Winston/Pino)
    const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        status: err.statusCode || 500,
        message: err.message,
        ...(isDevelopment && { stack: err.stack })
    };

    console.error(`[ERROR_LOG] ${JSON.stringify(logData)}`);

    const statusCode = err.statusCode || 500;
    const message = isDevelopment ? err.message : (statusCode === 500 ? "Internal Server Error" : err.message);

    res.status(statusCode).json({
        success: false,
        message,
        ...(isDevelopment && { stack: err.stack })
    });
};
