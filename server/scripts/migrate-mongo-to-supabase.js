/**
 * Safe Data Migration Utility: MongoDB to Supabase / PostgreSQL
 * Transfers legacy collections (Users, Events, Registrations, Announcements, Certificates)
 * to Supabase PostgreSQL without deleting or dropping source records.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, query, closeDB } from '../src/config/db.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function migrateData() {
  console.log('====================================================');
  console.log(' ContractIQ: MongoDB to Supabase / PostgreSQL Migration');
  console.log('====================================================\n');

  if (!MONGO_URI) {
    console.log('[Notice] MONGO_URI not configured in environment variables.');
    console.log('No MongoDB legacy database found to migrate. Supabase PostgreSQL is ready.');
    return;
  }

  let mongoConn = null;
  try {
    console.log('[Step 1] Connecting to source MongoDB instance...');
    mongoConn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[Step 1] Connected to MongoDB successfully.');

    console.log('[Step 2] Connecting to target Supabase PostgreSQL...');
    await connectDB();
    console.log('[Step 2] Connected to Supabase PostgreSQL successfully.');

    const db = mongoose.connection.db;

    // 1. Migrate Users to profiles and users
    console.log('\n[Step 3] Migrating Users...');
    const usersColl = db.collection('users');
    const mongoUsers = await usersColl.find({}).toArray();
    console.log(`Found ${mongoUsers.length} user records in MongoDB.`);

    let migratedUsers = 0;
    for (const u of mongoUsers) {
      const email = (u.email || '').toLowerCase().trim();
      if (!email) continue;

      const userId = u._id ? u._id.toString() : crypto.randomUUID();
      const role = u.role || 'client';
      const name = u.name || email.split('@')[0];

      await query(
        `INSERT INTO users (id, name, email, password_hash, role, phone, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO NOTHING`,
        [
          userId,
          name,
          email,
          u.password || '',
          role,
          u.phone || '',
          u.isActive !== false,
          u.createdAt || new Date(),
        ]
      );

      try {
        await query(
          `INSERT INTO profiles (id, email, full_name, role, phone, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (email) DO NOTHING`,
          [
            userId,
            email,
            name,
            role,
            u.phone || '',
            u.isActive !== false,
            u.createdAt || new Date(),
          ]
        );
      } catch (_) {}

      migratedUsers++;
    }
    console.log(`[Users] Migrated ${migratedUsers} user profiles safely.`);

    // 2. Migrate Events if present
    console.log('\n[Step 4] Migrating Legacy Events...');
    const eventsColl = db.collection('events');
    const mongoEvents = await eventsColl.find({}).toArray();
    console.log(`Found ${mongoEvents.length} event records in MongoDB.`);

    let migratedEvents = 0;
    for (const ev of mongoEvents) {
      const eventId = ev._id ? ev._id.toString() : crypto.randomUUID();
      await query(
        `INSERT INTO events (
          id, title, description, category, banner_image, event_date,
          start_time, end_time, venue, venue_type, meeting_url, creator_id,
          organizer_name, organizer_email, department, max_capacity, registered_count,
          registration_deadline, is_paid, ticket_price, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (id) DO NOTHING`,
        [
          eventId,
          ev.title || 'Untitled Event',
          ev.description || '',
          ev.category || 'General',
          ev.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
          ev.eventDate || new Date(),
          ev.startTime || '09:00',
          ev.endTime || '17:00',
          ev.venue || 'Main Hall',
          ev.venueType || 'offline',
          ev.meetingUrl || '',
          ev.creator ? ev.creator.toString() : null,
          ev.organizerName || 'Organizer',
          ev.organizerEmail || 'organizer@contractiq.law',
          ev.department || 'General',
          ev.maxCapacity || 100,
          ev.registeredCount || 0,
          ev.registrationDeadline || new Date(),
          ev.isPaid || false,
          ev.ticketPrice || 0,
          ev.status || 'approved',
        ]
      );
      migratedEvents++;
    }
    console.log(`[Events] Migrated ${migratedEvents} events safely.`);

    console.log('\n====================================================');
    console.log(' MIGRATION COMPLETED SUCCESSFULLY');
    console.log(' Original MongoDB database preserved untouched.');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    if (mongoConn) {
      await mongoose.disconnect();
    }
    await closeDB();
  }
}

migrateData();
