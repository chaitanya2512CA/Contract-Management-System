import mongoose from 'mongoose';

let mongodInstance = null;

export const connectDB = async () => {
  // If already connected, reuse connection (essential for serverless environments)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college_events';

  try {
    console.log(`[DB] Connecting to MongoDB...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: process.env.VERCEL ? 5000 : 2500,
    });
    console.log('[DB] Connected to MongoDB database.');
  } catch (error) {
    console.warn(`[DB] Connection to configured MongoDB failed: ${error.message}`);

    // If running on Vercel or in cloud serverless, do not download binaries
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.error(
        '[DB] Production environment detected. Please ensure MONGO_URI is configured with a valid MongoDB cluster (e.g. MongoDB Atlas).'
      );
      throw error;
    }

    // In local development, launch embedded MongoDB Memory Server
    console.log('[DB] Launching embedded MongoDB Memory Server for seamless local execution...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const inMemoryUri = mongodInstance.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`[DB] Connected to embedded MongoDB in-memory database: ${inMemoryUri}`);
    } catch (memError) {
      console.error('[DB] Critical error starting in-memory MongoDB:', memError);
      throw memError;
    }
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};
