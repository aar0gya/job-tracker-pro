/**
 * Database Configuration
 */

const mongoose = require('mongoose');

async function connectDB() {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
}

module.exports = connectDB;