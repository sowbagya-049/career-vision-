const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MongoDB URI is provided
    if (!process.env.MONGODB_URI) {
      console.log('⚠️ MONGODB_URI not provided in .env file');
      console.log('🔄 Using local MongoDB fallback');
      process.env.MONGODB_URI = 'mongodb://localhost:27017/careervision';
    }

    console.log('🔄 Connecting to MongoDB...');
    // Mask sensitive parts of the connection string for logging
    const loggedUri = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('Connection string:', loggedUri);
    
    const options = {
      useNewUrlParser: true, // Still good practice to include, though often default
      useUnifiedTopology: true, // Still good practice to include, though often default
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      // bufferMaxEntries and bufferCommands are deprecated/removed in Mongoose 6+
      // and should be removed. Mongoose handles buffering differently now.
      // If you need to control command buffering, you might look into the
      // new autoCreate property on schemas or global `mongoose.set('bufferCommands', false)`
      // for advanced use cases, but typically removing them is the fix.
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`🔗 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔌 Mongoose connection closed through app termination (SIGINT)');
        process.exit(0);
      } catch (error) {
        console.error('Error closing Mongoose connection on SIGINT:', error);
        process.exit(1);
      }
    });

    process.on('SIGTERM', async () => {
        try {
            await mongoose.connection.close();
            console.log('🔌 Mongoose connection closed through app termination (SIGTERM)');
            process.exit(0);
        } catch (error) {
            console.error('Error closing Mongoose connection on SIGTERM:', error);
            process.exit(1);
        }
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error message:', error.message);
    
    // In development, continue without database
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Running in development mode without database');
      console.log('💡 Please update your .env file with correct MongoDB Atlas URI or ensure MongoDB is running locally.');
    } else {
      console.error('Application terminating due to MongoDB connection failure in production mode.');
      process.exit(1);
    }
  }
};

module.exports = connectDB;