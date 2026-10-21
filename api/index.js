import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';
import { seedDatabase } from '../server/src/config/seed.js';

let isInitialized = false;

export default async function handler(req, res) {
  if (!isInitialized) {
    try {
      await connectDB();
      await seedDatabase();
      isInitialized = true;
    } catch (err) {
      console.warn('[Vercel Serverless] DB connection notice:', err.message);
    }
  }
  return app(req, res);
}
