const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    // Add connection options with timeout
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000,
      bufferCommands: true, // Allow queries before connection
      maxPoolSize: 10,
      minPoolSize: 1
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    console.log(`🔗 Connection String: ${process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('💡 Make sure MongoDB is running locally or update MONGODB_URI in .env file');
    console.log('💡 For local MongoDB: mongodb://localhost:27017/threat-combat');
    console.log('💡 For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/threat-combat');
    
    // Don't exit immediately, let the server start without DB for testing
    console.log('⚠️  Server will start without database connection for testing');
    throw error; // Re-throw to handle in server.js
  }
};

module.exports = connectDB;
