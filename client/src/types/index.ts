export type UserRole = 'client' | 'lawyer' | 'business' | 'admin' | 'student' | 'organizer';

export type LawyerSpecialty =
  | 'Criminal Lawyer'
  | 'Corporate and Commercial Lawyer'
  | 'Contract Lawyer'
  | 'Family and Divorce Lawyer'
  | 'Property and Real Estate Lawyer'
  | 'Civil Litigation Lawyer'
  | 'Tax and GST Lawyer'
  | 'Intellectual Property Lawyer'
  | 'Employment and Labour Lawyer'
  | 'Consumer Rights Lawyer'
  | 'Cybercrime and Technology Lawyer'
  | 'Immigration Lawyer'
  | 'Banking and Financial Lawyer'
  | 'Constitutional and Administrative Lawyer'
  | 'General Legal Practice';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  city?: string;
  state?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  lawyerProfile?: LawyerProfile;
  studentId?: string;
  employeeId?: string;
  adminId?: string;
  department?: string;
  graduationYear?: number;
  interests?: string[];
  organizationName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface LawyerProfile {
  id: string;
  user_id: string;
  full_name: string;
  headline: string;
  primary_specialty: LawyerSpecialty | string;
  additional_specialties: string[];
  experience_years: number;
  bar_council_number: string;
  bar_state: string;
  languages: string[];
  education?: Array<{ degree: string; university: string; year: number }>;
  consultation_fee_15: number;
  consultation_fee_30: number;
  consultation_fee_60: number;
  consultation_modes: Array<'chat' | 'audio' | 'video' | 'in_person'>;
  is_instant_booking: boolean;
  is_verified: boolean;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  rating_avg: number;
  rating_count: number;
  total_consultations: number;
  bio: string;
  city: string;
  state: string;
  avatar?: string;
  contact_phone?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_name?: string;
  bank_beneficiary_name?: string;
  schedules?: AvailabilitySchedule[];
  reviews?: ClientReview[];
  services?: LegalService[];
}

export interface AvailabilitySchedule {
  id: string;
  lawyer_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday ...
  start_time: string;
  end_time: string;
  is_active: boolean;
  slot_duration_minutes?: number;
}

export type ConsultationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ConsultationBooking {
  id: string;
  booking_ref: string;
  client_id: string;
  client_name?: string;
  client_email?: string;
  client_avatar?: string;
  client_phone?: string;
  lawyer_id: string;
  lawyer_name?: string;
  lawyer_specialty?: string;
  lawyer_avatar?: string;
  lawyer_city?: string;
  practice_area: string;
  consultation_mode: 'chat' | 'audio' | 'video' | 'in_person';
  duration_minutes: number;
  scheduled_start: string;
  scheduled_end: string;
  fee_amount: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  status: ConsultationStatus;
  legal_issue_description: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  client_documents?: string[];
  meeting_room_id?: string;
  lawyer_notes?: string;
  rejection_reason?: string;
  client_rating?: number;
  client_review?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  booking_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  sender_role: string;
  recipient_id: string;
  content: string;
  message_type: 'text' | 'document' | 'system' | 'audio';
  attachment_url?: string;
  attachment_name?: string;
  is_read: boolean;
  created_at: string;
}

export type ContractStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'signed'
  | 'active'
  | 'expired'
  | 'terminated';

export interface Contract {
  id: string;
  contract_ref: string;
  title: string;
  contract_type: 'nda' | 'service' | 'employment' | 'commercial' | 'lease' | 'vendor' | 'custom';
  organization_id: string;
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
  company_name?: string;
  status: ContractStatus;
  current_version: number;
  content_text: string;
  file_url?: string;
  effective_date?: string;
  expiration_date?: string;
  renewal_notice_days: number;
  auto_renew: boolean;
  contract_value: number;
  currency: string;
  ai_risk_score?: number;
  ai_summary?: string;
  ai_risk_flags?: Array<{ severity: 'high' | 'medium' | 'low' | 'info'; clause: string; detail: string }>;
  ai_clause_suggestions?: Array<{ clause: string; suggestion: string }>;
  shared_permission?: string;
  shared_expires_at?: string;
  versions?: ContractVersion[];
  approvals?: ContractApproval[];
  signatures?: ContractSignature[];
  activeShares?: any[];
  created_at: string;
  updated_at: string;
}

export interface ContractVersion {
  id: string;
  contract_id: string;
  version_number: number;
  content_text: string;
  change_summary: string;
  created_by?: string;
  author_name?: string;
  created_at: string;
}

export interface ContractApproval {
  id: string;
  contract_id: string;
  approver_id: string;
  approver_name?: string;
  approver_email?: string;
  stage_name: string;
  sequence_order: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  acted_at?: string;
}

export interface ContractSignature {
  id: string;
  contract_id: string;
  signer_name: string;
  signer_email: string;
  signer_role: string;
  signature_data?: string;
  status: 'pending' | 'signed' | 'declined';
  signed_at?: string;
}

export type CaseStatus =
  | 'enquiry'
  | 'consultation'
  | 'engagement_pending'
  | 'active_matter'
  | 'hearing_proceedings'
  | 'closed';

export interface LegalCase {
  id: string;
  case_ref: string;
  title: string;
  practice_area: string;
  client_id: string;
  client_name?: string;
  client_email?: string;
  client_avatar?: string;
  client_phone?: string;
  assigned_lawyer_id: string;
  lawyer_name?: string;
  lawyer_specialty?: string;
  status: CaseStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  court_name?: string;
  case_number?: string;
  next_hearing_date?: string;
  summary?: string;
  chronology?: Array<{ date: string; event: string }>;
  private_lawyer_notes?: string;
  client_notes?: string;
  related_contract_id?: string;
  related_contract_title?: string;
  documents?: CaseDocument[];
  created_at: string;
  updated_at: string;
}

export interface CaseDocument {
  id: string;
  case_id: string;
  uploaded_by: string;
  uploader_name?: string;
  doc_category: string;
  title: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface LegalService {
  id: string;
  lawyer_id: string;
  lawyer_name?: string;
  lawyer_headline?: string;
  lawyer_rating?: number;
  lawyer_verified?: boolean;
  lawyer_avatar?: string;
  title: string;
  category: string;
  description: string;
  deliverables: string[];
  price_amount: number;
  currency: string;
  estimated_turnaround_days: number;
  is_active: boolean;
}

export interface ClientReview {
  id: string;
  booking_id: string;
  client_id: string;
  client_name?: string;
  client_avatar?: string;
  lawyer_id: string;
  rating: number;
  review_text: string;
  tags?: string[];
  created_at: string;
}

export interface LawyerEarningsSummary {
  total_gross: number;
  total_commission: number;
  available_balance: number;
  total_withdrawn: number;
  total_net: number;
}

export interface PlatformMetrics {
  totalClients: number;
  totalBusinesses: number;
  totalLawyers: number;
  verifiedLawyers: number;
  pendingVerifications: number;
  totalConsultations: number;
  completedConsultations: number;
  totalContracts: number;
  totalCases: number;
  grossVolumeINR: number;
  platformCommissionsINR: number;
  paidPayoutsINR: number;
  pendingPayoutsINR: number;
}

// Preserved Legacy Types
export type EventCategory = 'Technical' | 'Hackathon' | 'Workshop' | 'Seminar' | 'Cultural' | 'Sports' | 'Conference' | 'Webinar';
export type EventStatus = 'pending_approval' | 'approved' | 'rejected' | 'cancelled' | 'completed';
export type RegistrationStatus = 'registered' | 'confirmed' | 'waitlisted' | 'attended' | 'cancelled';

export interface CollegeEvent {
  _id: string;
  id?: string;
  title: string;
  description: string;
  category: EventCategory;
  bannerImage: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  venueType: 'offline' | 'online' | 'hybrid';
  meetingUrl?: string;
  organizer?: User | string;
  organizerName?: string;
  organizerContact?: string;
  department?: string;
  maxCapacity: number;
  registeredCount: number;
  waitlistCount?: number;
  availableSeats?: number;
  isRegistrationOpen?: boolean;
  registrationDeadline?: string;
  isWaitlistAvailable?: boolean;
  isPaid?: boolean;
  ticketPrice?: number;
  status: EventStatus;
  tags?: string[];
  eligibility?: string;
  prerequisites?: string;
  rejectionReason?: string;
  isTeamEvent?: boolean;
  teamMinSize?: number;
  teamMaxSize?: number;
  teamSizeMin?: number;
  teamSizeMax?: number;
  views?: number;
  featured?: boolean;
  ratingAverage?: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Registration {
  _id: string;
  id?: string;
  event: CollegeEvent;
  user: User;
  ticketCode: string;
  registrationType?: 'individual' | 'team';
  teamName?: string;
  team?: {
    _id: string;
    teamName: string;
    joinCode: string;
  };
  teamMembers?: Array<{ name: string; email: string; rollNumber?: string }>;
  status: RegistrationStatus;
  attendanceStatus?: 'unmarked' | 'present' | 'absent';
  qrCodeData: string;
  registeredAt?: string;
  registrationDate?: string;
  attendedAt?: string;
  certificateIssued?: boolean;
  certificate?: string | Certificate;
  feedbackRating?: number;
  feedbackComment?: string;
}

export interface EventRegistration extends Registration {}

export interface AttendanceRecord {
  _id: string;
  event: CollegeEvent | string;
  student: User | string;
  registration: EventRegistration | string;
  checkedInAt: string;
  verifiedBy: User | string;
  scanMethod: 'qr_scan' | 'manual_entry';
}

export interface Certificate {
  _id: string;
  id?: string;
  certificateCode: string;
  student: User | string;
  user?: User | string;
  event: CollegeEvent | string;
  studentName: string;
  studentRoll?: string;
  eventTitle: string;
  eventDate?: string;
  category?: string;
  issueDate: string;
  issuedBy?: User | string;
  issuerOrganization?: string;
  verificationUrl: string;
  status?: 'valid' | 'revoked';
}

export interface Announcement {
  _id: string;
  id?: string;
  event?: CollegeEvent | string;
  eventTitle?: string;
  author?: User | string;
  authorName?: string;
  authorRole?: string;
  title: string;
  content?: string;
  message?: string;
  priority?: 'low' | 'normal' | 'important' | 'high' | 'urgent';
  targetAudience?: 'all' | 'students' | 'organizers' | 'registered_participants';
  isPinned?: boolean;
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  id?: string;
  recipient?: string;
  title: string;
  message: string;
  type?: 'event_approval' | 'event_update' | 'registration' | 'cancellation' | 'announcement' | 'certificate' | 'system' | string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SystemNotification extends AppNotification {}

export interface AuditLogItem {
  _id: string;
  id?: string;
  admin?: User | string;
  adminName?: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLog extends AuditLogItem {}

export interface AdminStats {
  users: {
    students: number;
    organizers: number;
    admins: number;
    total: number;
  };
  events: {
    total: number;
    pending: number;
    approved: number;
    cancelled: number;
  };
  participation: {
    totalRegistrations: number;
    totalAttended: number;
    attendanceRate: number;
  };
  categoryStats: { category: string; count: number; totalRegistrations: number }[];
  monthlyRegistrations: { month: string; registrations: number; attended: number }[];
  recentLogs: AuditLogItem[];
}
