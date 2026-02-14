/**
 * Job Tracker Backend Server
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import modules
const connectDB = require('./config/database');
const applicationRoutes = require('./routes/applicationRoutes');
const errorHandler = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Routes
app.use('/api/applications', applicationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Job Tracker API',
        version: '1.0.0',
        endpoints: {
            applications: '/api/applications',
            statistics: '/api/applications/stats',
            health: '/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Error handler - MUST BE LAST
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║  🚀 Job Tracker API Server Running        ║
║                                            ║
║  Port: ${PORT}                                ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  URL: http://localhost:${PORT}                ║
║                                            ║
║  Endpoints:                                ║
║  → /api/applications                       ║
║  → /api/applications/stats                 ║
║  → /health                                 ║
╚════════════════════════════════════════════╝
    `);
});

// Handle errors
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

module.exports = app;