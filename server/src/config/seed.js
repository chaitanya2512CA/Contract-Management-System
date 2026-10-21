import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { Attendance } from '../models/Attendance.js';
import { Certificate } from '../models/Certificate.js';
import { Announcement } from '../models/Announcement.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateTicketCode, generateCertificateCode, generateQRCodeDataUrl } from '../utils/qrHelper.js';

dotenv.config();

/**
 * Idempotently verify and seed core demo accounts across all three roles:
 * - Admin: admin@college.edu / Admin@12345
 * - Student: student@college.edu / Student@12345
 * - Organizer: organizer@college.edu / Organizer@12345
 */
export const ensureDemoAccounts = async () => {
  // 1. Ensure Super Administrator
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@college.edu').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  let admin = await User.findOne({ email: adminEmail }).select('+password');
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Chief Campus Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      adminId: process.env.ADMIN_ID || 'ADM-2026-001',
      department: 'Campus Administration',
      phone: '+1 (555) 019-2834',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      bio: 'Oversees campus technical councils, student organization approvals, and inter-collegiate event compliance.',
      isActive: true,
    });
    console.log(`[Seed] Super Administrator created (${adminEmail}).`);
  } else {
    const isMatch = await admin.comparePassword(adminPassword);
    if (!isMatch || !admin.isActive) {
      admin.password = adminPassword;
      admin.isActive = true;
      await admin.save();
      console.log(`[Seed] Super Administrator credentials synced (${adminEmail}).`);
    }
  }

  // 2. Ensure Demo Student
  const studentEmail = 'student@college.edu';
  const studentPassword = 'Student@12345';
  let student = await User.findOne({ email: studentEmail }).select('+password');
  if (!student) {
    student = await User.create({
      name: 'Alex Rivera',
      email: studentEmail,
      password: studentPassword,
      role: 'student',
      studentId: 'CS-2024-0042',
      department: 'Computer Science & Engineering',
      graduationYear: 2026,
      phone: '+1 (555) 432-1098',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
      bio: '3rd year CS undergrad. Full-stack enthusiast, hackathon addict, and cloud architect aspirant.',
      interests: ['Hackathons', 'Artificial Intelligence', 'Web Development', 'Robotics'],
      isActive: true,
    });
    console.log(`[Seed] Demo Student created (${studentEmail}).`);
  } else {
    const isMatch = await student.comparePassword(studentPassword);
    if (!isMatch || !student.isActive) {
      student.password = studentPassword;
      student.isActive = true;
      await student.save();
      console.log(`[Seed] Demo Student credentials verified and synced (${studentEmail}).`);
    }
  }

  // 3. Ensure Demo Organizer
  const organizerEmail = 'organizer@college.edu';
  const organizerPassword = 'Organizer@12345';
  let organizer = await User.findOne({ email: organizerEmail }).select('+password');
  if (!organizer) {
    organizer = await User.create({
      name: 'Dr. Sarah Mitchell',
      email: organizerEmail,
      password: organizerPassword,
      role: 'organizer',
      employeeId: 'FAC-ENG-402',
      department: 'Computer Science & Engineering',
      organizationName: 'ACM Student Chapter & Coding Club',
      phone: '+1 (555) 345-6789',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      bio: 'Faculty advisor for ACM Chapter. Passionate about hackathons, competitive programming, and AI research.',
      isActive: true,
    });
    console.log(`[Seed] Demo Organizer created (${organizerEmail}).`);
  } else {
    const isMatch = await organizer.comparePassword(organizerPassword);
    if (!isMatch || !organizer.isActive) {
      organizer.password = organizerPassword;
      organizer.isActive = true;
      await organizer.save();
      console.log(`[Seed] Demo Organizer credentials verified and synced (${organizerEmail}).`);
    }
  }
};

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Checking database collections...');
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[Seed] Database already contains ${userCount} users. Ensuring core demo accounts...`);
      await ensureDemoAccounts();
      return;
    }

    console.log('[Seed] Seeding realistic college database...');

    // 1. Create Administrator
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@college.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'Chief Campus Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      adminId: process.env.ADMIN_ID || 'ADM-2026-001',
      department: 'Campus Administration',
      phone: '+1 (555) 019-2834',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      bio: 'Oversees campus technical councils, student organization approvals, and inter-collegiate event compliance.',
    });

    // 2. Create Organizers
    const organizerACM = await User.create({
      name: 'Dr. Sarah Mitchell',
      email: 'organizer@college.edu',
      password: 'Organizer@12345',
      role: 'organizer',
      employeeId: 'FAC-ENG-402',
      department: 'Computer Science & Engineering',
      organizationName: 'ACM Student Chapter & Coding Club',
      phone: '+1 (555) 345-6789',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      bio: 'Faculty advisor for ACM Chapter. Passionate about hackathons, competitive programming, and AI research.',
    });

    const organizerRobotics = await User.create({
      name: 'Prof. Rajesh Sharma',
      email: 'robotics@college.edu',
      password: 'Organizer@12345',
      role: 'organizer',
      employeeId: 'FAC-MECH-108',
      department: 'Robotics & Automation',
      organizationName: 'Campus Robotics & IoT Society',
      phone: '+1 (555) 987-6543',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      bio: 'Leading annual inter-college autonomous robot competitions and drone design expos.',
    });

    const organizerCultural = await User.create({
      name: 'Elena Rostova',
      email: 'cultural@college.edu',
      password: 'Organizer@12345',
      role: 'organizer',
      employeeId: 'STU-LEAD-089',
      department: 'Liberal Arts & Media',
      organizationName: 'Campus Cultural Activities Board',
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      bio: 'Head coordinator for annual youth festival Tarang, musical symphonies, and theatrical performances.',
    });

    // 3. Create Students
    const student1 = await User.create({
      name: 'Alex Rivera',
      email: 'student@college.edu',
      password: 'Student@12345',
      role: 'student',
      studentId: 'CS-2024-0042',
      department: 'Computer Science & Engineering',
      graduationYear: 2026,
      phone: '+1 (555) 432-1098',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
      bio: '3rd year CS undergrad. Full-stack enthusiast, hackathon addict, and cloud architect aspirant.',
      interests: ['Hackathons', 'Artificial Intelligence', 'Web Development', 'Robotics'],
    });

    const student2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@college.edu',
      password: 'Student@12345',
      role: 'student',
      studentId: 'IT-2024-0118',
      department: 'Information Technology',
      graduationYear: 2026,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
      interests: ['CyberSecurity', 'Workshops', 'Technical', 'Seminar'],
    });

    const student3 = await User.create({
      name: 'Liam Chen',
      email: 'liam@college.edu',
      password: 'Student@12345',
      role: 'student',
      studentId: 'MECH-2025-0077',
      department: 'Mechanical Engineering',
      graduationYear: 2027,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      interests: ['Robotics', 'Sports', 'Cultural', 'Competitions'],
    });

    console.log('[Seed] Core user accounts created.');

    // 4. Create Sample College Events
    const now = new Date();

    // Event 1: Hackathon (Approved, Upcoming)
    const event1Date = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    const event1Deadline = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    const hackathon = await Event.create({
      title: 'HackCampus 2026: 36-Hour National Hackathon',
      description:
        'The premier inter-collegiate hackathon bringing together over 300 passionate developers, designers, and innovators. Build groundbreaking solutions in AI agents, fintech, healthcare, and sustainable tech. Includes mentorship from Google and Microsoft engineers, free food, swag bags, and a $10,000 prize pool.',
      category: 'Hackathon',
      bannerImage:
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200',
      eventDate: event1Date,
      startTime: '09:00 AM',
      endTime: '09:00 PM',
      venue: 'Main Auditorium & CS Innovation Hub',
      venueType: 'offline',
      organizer: organizerACM._id,
      organizerName: 'ACM Student Chapter',
      organizerContact: 'acm-hack@college.edu',
      maxCapacity: 150,
      registeredCount: 88,
      registrationDeadline: event1Deadline,
      isPaid: false,
      ticketPrice: 0,
      eligibility: 'Open to all undergraduate & postgraduate university students',
      prerequisites: 'Laptop and college ID card required. Form teams of 2 to 4 members.',
      isTeamEvent: true,
      teamMinSize: 2,
      teamMaxSize: 4,
      status: 'approved',
      approvedBy: admin._id,
      approvedAt: now,
      tags: ['Hackathon', 'Artificial Intelligence', 'Web Development', 'Innovation', 'Prizes'],
      featured: true,
      views: 420,
    });

    // Event 2: AI & LLM Workshop (Approved, Upcoming)
    const event2Date = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    const workshop = await Event.create({
      title: 'Deep Dive into Agentic AI & Generative Models',
      description:
        'Hands-on masterclass exploring Large Language Models, prompt engineering, multi-agent frameworks, and retrieval-augmented generation (RAG). Attendees will build an autonomous research assistant from scratch in Python.',
      category: 'Workshop',
      bannerImage:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
      eventDate: event2Date,
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      venue: 'Advanced AI Lab, Science Block Room 304',
      venueType: 'hybrid',
      meetingUrl: 'https://meet.google.com/campus-ai-2026',
      organizer: organizerACM._id,
      organizerName: 'ACM Student Chapter',
      organizerContact: 'acm@college.edu',
      maxCapacity: 60,
      registeredCount: 52,
      registrationDeadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      isPaid: true,
      ticketPrice: 15,
      eligibility: 'Basic knowledge of Python suggested',
      prerequisites: 'Python 3.10+ installed on personal laptop',
      isTeamEvent: false,
      status: 'approved',
      approvedBy: admin._id,
      approvedAt: now,
      tags: ['Workshop', 'Artificial Intelligence', 'Machine Learning', 'Python', 'Hands-on'],
      featured: true,
      views: 310,
    });

    // Event 3: Cultural Fest "Tarang 2026" (Approved)
    const event3Date = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);
    const culturalFest = await Event.create({
      title: 'Tarang 2026: Annual Inter-College Cultural Extravaganza',
      description:
        'Three days of music, dance, theatrical drama, fashion shows, street plays, and celebrity artist nights! Witness talents from over 40 colleges across the state competing for prestigious campus trophies.',
      category: 'Cultural',
      bannerImage:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200',
      eventDate: event3Date,
      startTime: '04:00 PM',
      endTime: '10:30 PM',
      venue: 'University Open Air Amphitheatre',
      venueType: 'offline',
      organizer: organizerCultural._id,
      organizerName: 'Campus Cultural Activities Board',
      organizerContact: 'tarang@college.edu',
      maxCapacity: 800,
      registeredCount: 412,
      registrationDeadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      isPaid: false,
      ticketPrice: 0,
      eligibility: 'All students, alumni, and faculty welcome with ID pass',
      status: 'approved',
      approvedBy: admin._id,
      approvedAt: now,
      tags: ['Cultural', 'Music', 'Dance', 'Festival', 'Celebrity Night'],
      featured: true,
      views: 950,
    });

    // Event 4: Autonomous Robotics League (Approved)
    const event4Date = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
    const robotics = await Event.create({
      title: 'RoboClash: All-Terrain Autonomous Rover Challenge',
      description:
        'Design, build, and navigate autonomous rovers through obstacle-laden terrains, simulated craters, and line-following mazes. Cash prizes for best telemetry, fastest speed, and most innovative mechanical chassis.',
      category: 'Sports',
      bannerImage:
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200',
      eventDate: event4Date,
      startTime: '11:00 AM',
      endTime: '04:00 PM',
      venue: 'Robotics Arena, Engineering Quad',
      venueType: 'offline',
      organizer: organizerRobotics._id,
      organizerName: 'Robotics & IoT Society',
      organizerContact: 'robotics@college.edu',
      maxCapacity: 40,
      registeredCount: 30,
      registrationDeadline: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      isPaid: false,
      ticketPrice: 0,
      eligibility: 'Teams of up to 4 students from any branch',
      isTeamEvent: true,
      teamMinSize: 2,
      teamMaxSize: 4,
      status: 'approved',
      approvedBy: admin._id,
      approvedAt: now,
      tags: ['Robotics', 'Hardware', 'Competition', 'IoT', 'Autonomous'],
      views: 180,
    });

    // Event 5: Completed Event (For Certificate Testing!)
    const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const completedEvent = await Event.create({
      title: 'Cloud Native & Kubernetes Symposium',
      description:
        'Industry keynote and architectural deep-dive into microservices orchestration, Docker container security, and CI/CD automation with AWS and Google Cloud platform experts.',
      category: 'Seminar',
      bannerImage:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
      eventDate: pastDate,
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      venue: 'Seminar Hall 1, Tech Tower',
      venueType: 'offline',
      organizer: organizerACM._id,
      organizerName: 'ACM Student Chapter',
      organizerContact: 'acm@college.edu',
      maxCapacity: 80,
      registeredCount: 75,
      registrationDeadline: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      isPaid: false,
      ticketPrice: 0,
      status: 'completed',
      approvedBy: admin._id,
      approvedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      tags: ['Technical', 'Cloud', 'Kubernetes', 'DevOps', 'Seminar'],
      views: 240,
    });

    // Event 6: Pending Approval Event (To test Admin Approval Workflow!)
    const event6Date = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const pendingEvent = await Event.create({
      title: 'CyberDefend 2026: Campus Capture The Flag (CTF)',
      description:
        'Ethical hacking and defensive security tournament. Challenges in reverse engineering, web exploitation, binary exploitation, digital forensics, and cryptographic ciphers.',
      category: 'Technical',
      bannerImage:
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
      eventDate: event6Date,
      startTime: '01:00 PM',
      endTime: '07:00 PM',
      venue: 'Cyber Forensics Lab, Block 4',
      venueType: 'offline',
      organizer: organizerRobotics._id,
      organizerName: 'Campus Security Council',
      organizerContact: 'security@college.edu',
      maxCapacity: 50,
      registeredCount: 0,
      registrationDeadline: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      isPaid: false,
      ticketPrice: 0,
      status: 'pending_approval', // READY FOR ADMIN APPROVAL TESTING
      tags: ['CyberSecurity', 'CTF', 'Hacking', 'Technical'],
      views: 45,
    });

    console.log('[Seed] Realistic college events created.');

    // 5. Pre-register Alex Rivera (student1) for upcoming Hackathon
    const alexTicketCode = generateTicketCode();
    const qrPayload = {
      ticketCode: alexTicketCode,
      eventId: hackathon._id,
      userId: student1._id,
      studentName: student1.name,
      studentEmail: student1.email,
      eventTitle: hackathon.title,
      eventDate: hackathon.eventDate,
      issuedAt: new Date().toISOString(),
    };
    const alexQrCode = await generateQRCodeDataUrl(qrPayload);

    await Registration.create({
      event: hackathon._id,
      user: student1._id,
      ticketCode: alexTicketCode,
      registrationType: 'individual',
      status: 'registered',
      qrCodeData: alexQrCode,
      registeredAt: new Date(),
    });

    // 6. Pre-register Alex Rivera for completed event and mark as ATTENDED with Certificate
    const pastTicketCode = generateTicketCode();
    const pastQrCode = await generateQRCodeDataUrl({ ticketCode: pastTicketCode });

    const pastReg = await Registration.create({
      event: completedEvent._id,
      user: student1._id,
      ticketCode: pastTicketCode,
      registrationType: 'individual',
      status: 'attended',
      attendedAt: pastDate,
      qrCodeData: pastQrCode,
      certificateIssued: true,
    });

    await Attendance.create({
      event: completedEvent._id,
      registration: pastReg._id,
      user: student1._id,
      markedBy: organizerACM._id,
      verificationMethod: 'qr_scan',
      markedAt: pastDate,
    });

    const certCode = generateCertificateCode();
    const cert = await Certificate.create({
      certificateCode: certCode,
      event: completedEvent._id,
      user: student1._id,
      studentName: student1.name,
      eventTitle: completedEvent.title,
      eventDate: completedEvent.eventDate,
      category: completedEvent.category,
      issueDate: pastDate,
      issuedBy: organizerACM._id,
      issuerOrganization: 'ACM Student Chapter',
    });

    pastReg.certificate = cert._id;
    await pastReg.save();

    // 7. Seed College-wide Announcements
    await Announcement.create({
      title: 'Welcome to Spring Campus Tech Season 2026!',
      content:
        'All student clubs and departmental chapters have posted their upcoming schedules. Ensure your student profile interests are updated to get personalized AI event recommendations on your dashboard.',
      author: admin._id,
      authorName: admin.name,
      authorRole: 'admin',
      priority: 'high',
      isPinned: true,
      targetAudience: 'all',
    });

    await Announcement.create({
      title: 'HackCampus 2026: Team Formations Now Open',
      content:
        'Hackathon participants can now create teams or join existing teams via invite codes directly from the event details page.',
      author: organizerACM._id,
      authorName: organizerACM.name,
      authorRole: 'organizer',
      event: hackathon._id,
      eventTitle: hackathon.title,
      priority: 'normal',
      targetAudience: 'all',
    });

    // 8. Seed Initial Audit Logs
    await AuditLog.create({
      admin: admin._id,
      adminName: admin.name,
      adminEmail: admin.email,
      action: 'APPROVE_EVENT',
      targetType: 'Event',
      targetId: hackathon._id.toString(),
      targetName: hackathon.title,
      details: 'Reviewed event proposal and approved for campus-wide publishing.',
    });

    await AuditLog.create({
      admin: admin._id,
      adminName: admin.name,
      adminEmail: admin.email,
      action: 'SYSTEM_INITIALIZATION',
      targetType: 'System',
      targetName: 'CampusPulse Core',
      details: 'Initial system provisioning and super administrator authorization completed.',
    });

    console.log('[Seed] Database initialization and realistic seeding complete!');
  } catch (error) {
    console.error('[Seed] Error during database seeding:', error);
  }
};

// Allow running standalone via "node src/config/seed.js"
if (process.argv[1]?.endsWith('seed.js')) {
  const { connectDB, closeDB } = await import('./db.js');
  await connectDB();
  await seedDatabase();
  await closeDB();
  process.exit(0);
}
