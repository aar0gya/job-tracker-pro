/**
 * Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Server Error'
    });
}

module.exports = errorHandler;