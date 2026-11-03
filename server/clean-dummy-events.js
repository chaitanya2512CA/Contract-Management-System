import dotenv from 'dotenv';
dotenv.config();

import { connectDB, query, closeDB } from './src/config/db.js';

const SEED_TITLES = [
  'AI Horizon 2026: 36-Hour National Hackathon',
  'Mastering Cloud-Native Microservices with Kubernetes',
  'CyberDefend 2026: Campus Capture The Flag (CTF)',
  'RoboWars 2026: Autonomous Combat Arena & Drone Racing',
  'Tarang 2026: Annual University Cultural & Musical Odyssey',
];

async function cleanDummyEvents() {
  console.log('====================================================');
  console.log(' Safe Neon PostgreSQL Sample Event Purge Utility');
  console.log('====================================================\n');

  try {
    await connectDB();

    console.log('[1/4] Inspecting database for sample / seed events...');
    const candidateRes = await query(
      `SELECT id, title, category, event_date, organizer_email, created_at 
       FROM events 
       WHERE title = ANY($1::varchar[]) AND organizer_email = 'organizer@college.edu'`,
      [SEED_TITLES]
    );

    console.log(`Found ${candidateRes.rows.length} identified sample seed event(s):`);
    for (const row of candidateRes.rows) {
      console.log(` - ID: ${row.id} | Title: "${row.title}" | Organizer: ${row.organizer_email}`);
    }

    if (candidateRes.rows.length === 0) {
      console.log('\n[2/4] No sample events exist in the database. Database is already clean.');
    } else {
      console.log('\n[2/4] Safely removing identified sample events (foreign keys cascaded)...');
      const deleteEventsRes = await query(
        `DELETE FROM events 
         WHERE title = ANY($1::varchar[]) AND organizer_email = 'organizer@college.edu'
         RETURNING id, title`,
        [SEED_TITLES]
      );
      console.log(`Successfully deleted ${deleteEventsRes.rows.length} sample event record(s).`);

      // Clean sample announcement and audit log
      console.log('\n[3/4] Cleaning associated sample announcement and audit records...');
      await query(`DELETE FROM announcements WHERE title = 'Hacker Guide & API Keys Released'`);
      await query(`DELETE FROM audit_logs WHERE details = 'Approved event: AI Horizon 2026'`);
      console.log('Associated sample announcements and audit records cleaned.');
    }

    console.log('\n[4/4] Verifying remaining database records...');
    const totalEventsRes = await query(`SELECT COUNT(*) as count FROM events`);
    const totalUsersRes = await query(`SELECT COUNT(*) as count FROM users`);
    const totalRegistrationsRes = await query(`SELECT COUNT(*) as count FROM event_registrations`);

    console.log(`- Remaining total events: ${totalEventsRes.rows[0].count}`);
    console.log(`- Remaining total users (students/admins/organizers): ${totalUsersRes.rows[0].count}`);
    console.log(`- Remaining total registrations: ${totalRegistrationsRes.rows[0].count}`);

    console.log('\n✅ Database clean-up completed safely without touching genuine data.');
  } catch (err) {
    console.error('❌ Error during sample event purge:', err.message);
    process.exit(1);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

cleanDummyEvents();
