import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campuspulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      // If we get 401 and not already on a login page, we can clear token
      if (
        !currentPath.includes('/login') &&
        !currentPath.includes('/register') &&
        currentPath !== '/'
      ) {
        localStorage.removeItem('campuspulse_token');
        localStorage.removeItem('campuspulse_user');
      }
    }
    return Promise.reject(error);
  }
);

/* ================= AUTH API ================= */
export const authService = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  register: (data: any) => api.post('/auth/register', data),

  loginStudent: (credentials: { email: string; password: string }) =>
    api.post('/auth/student/login', credentials),

  loginOrganizer: (credentials: { email: string; password: string }) =>
    api.post('/auth/organizer/login', credentials),

  loginAdmin: (credentials: { email: string; password: string }) =>
    api.post('/auth/admin/login', credentials),

  registerStudent: (data: any) => api.post('/auth/student/register', data),

  registerOrganizer: (data: any) => api.post('/auth/organizer/register', data),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data: any) => api.put('/auth/profile', data),

  changePassword: (data: any) => api.put('/auth/change-password', data),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
};

/* ================= CONTRACTIQ LAWYER API ================= */
export const lawyerService = {
  getLawyers: (params?: any) => api.get('/lawyers', { params }),
  getLawyerById: (id: string) => api.get(`/lawyers/${id}`),
  updateProfile: (data: any) => api.put('/lawyers/me/profile', data),
  updateAvailability: (data: any) => api.put('/lawyers/me/availability', data),
};

/* ================= VERIFICATION API ================= */
export const verificationService = {
  submit: (data: any) => api.post('/lawyer-verification', data),
  getStatus: () => api.get('/lawyer-verification/status'),
  getQueue: () => api.get('/lawyer-verification/queue'),
  review: (id: string, data: { status: string; adminNotes?: string }) =>
    api.put(`/lawyer-verification/${id}/review`, data),
};

/* ================= CONSULTATION API ================= */
export const consultationService = {
  create: (data: any) => api.post('/consultations', data),
  getAll: (params?: any) => api.get('/consultations', { params }),
  getById: (id: string) => api.get(`/consultations/${id}`),
  accept: (id: string) => api.put(`/consultations/${id}/accept`),
  reject: (id: string, reason?: string) => api.put(`/consultations/${id}/reject`, { rejectionReason: reason }),
  joinRoom: (id: string) => api.get(`/consultations/${id}/room`),
  complete: (id: string, notes?: string) => api.put(`/consultations/${id}/complete`, { notes }),
  getMessages: (bookingId: string) => api.get(`/consultations/${bookingId}/messages`),
  sendMessage: (bookingId: string, data: any) => api.post(`/consultations/${bookingId}/messages`, data),
};

/* ================= CLM CONTRACTS API ================= */
export const contractService = {
  getAll: (params?: any) => api.get('/contracts', { params }),
  getById: (id: string) => api.get(`/contracts/${id}`),
  create: (data: any) => api.post('/contracts', data),
  analyze: (id: string) => api.post(`/contracts/${id}/analyze`),
  chat: (id: string, question: string) => api.post(`/contracts/${id}/chat`, { question }),
  share: (id: string, data: any) => api.post(`/contracts/${id}/share`, data),
  revokeShare: (id: string, permId: string) => api.delete(`/contracts/${id}/share/${permId}`),
  sign: (id: string, data: any) => api.post(`/contracts/${id}/sign`, data),
};

/* ================= LEGAL CASES API ================= */
export const caseService = {
  getAll: (params?: any) => api.get('/cases', { params }),
  getById: (id: string) => api.get(`/cases/${id}`),
  create: (data: any) => api.post('/cases', data),
  update: (id: string, data: any) => api.put(`/cases/${id}`, data),
  addDocument: (id: string, data: any) => api.post(`/cases/${id}/documents`, data),
};

/* ================= LEGAL SERVICES MARKETPLACE ================= */
export const legalServicesService = {
  getAll: (params?: any) => api.get('/services', { params }),
  create: (data: any) => api.post('/services', data),
  request: (id: string, data: any) => api.post(`/services/${id}/request`, data),
  getRequests: () => api.get('/services/requests/all'),
};

/* ================= PAYMENTS & RAZORPAY API ================= */
export const paymentService = {
  createOrder: (data: any) => api.post('/payments/orders', data),
  verify: (data: any) => api.post('/payments/verify', data),
  testCheckout: (bookingId: string) => api.post('/payments/test-checkout', { bookingId }),
};

/* ================= FINANCIALS & PAYOUTS API ================= */
export const financialService = {
  getEarnings: () => api.get('/financials/earnings'),
  requestPayout: (amount: number) => api.post('/financials/payouts', { amount }),
  getAdminPayouts: () => api.get('/financials/admin/payouts'),
  processPayout: (id: string, data: any) => api.put(`/financials/admin/payouts/${id}`, data),
};

/* ================= CLIENT REVIEWS API ================= */
export const reviewService = {
  submit: (data: any) => api.post('/reviews', data),
  getByLawyer: (lawyerId: string) => api.get(`/reviews/lawyer/${lawyerId}`),
};

/* ================= EVENT API ================= */
export const eventService = {
  getEvents: (params?: any) => api.get('/events', { params }),

  getEventById: (id: string) => api.get(`/events/${id}`),

  getTrendingEvents: () => api.get('/events/trending'),

  getRecommendedEvents: () => api.get('/events/recommendations'),

  getCalendarEvents: (params?: any) => api.get('/events/calendar', { params }),

  getMyOrganizedEvents: () => api.get('/events/my-organized'),

  createEvent: (data: any) => api.post('/events', data),

  updateEvent: (id: string, data: any) => api.put(`/events/${id}`, data),

  cancelEvent: (id: string, reason: string) => api.put(`/events/${id}/cancel`, { reason }),
};

/* ================= REGISTRATION API ================= */
export const registrationService = {
  registerForEvent: (eventId: string, bypassConflict: boolean = false) =>
    api.post(`/registrations/register/${eventId}`, { bypassConflict }),

  registerTeam: (eventId: string, teamName: string) =>
    api.post(`/registrations/team/${eventId}`, { teamName }),

  joinTeam: (eventId: string, joinCode: string) =>
    api.post(`/registrations/join-team/${eventId}`, { joinCode }),

  cancelRegistration: (registrationId: string) =>
    api.put(`/registrations/${registrationId}/cancel`),

  getMyRegistrations: (status?: string) =>
    api.get('/registrations/my', { params: { status } }),

  getEventParticipants: (eventId: string, params?: any) =>
    api.get(`/registrations/event/${eventId}`, { params }),

  exportParticipantsCSV: (eventId: string) =>
    api.get(`/registrations/event/${eventId}/export-csv`, { responseType: 'blob' }),
};

/* ================= ATTENDANCE API ================= */
export const attendanceService = {
  verifyAndMarkAttendance: (ticketCode: string, eventId?: string) =>
    api.post('/attendance/verify', { ticketCode, eventId }),

  getEventAttendanceStats: (eventId: string) => api.get(`/attendance/stats/${eventId}`),
};

/* ================= CERTIFICATE API ================= */
export const certificateService = {
  getMyCertificates: () => api.get('/certificates/my'),

  issueCertificatesForEvent: (eventId: string) => api.post(`/certificates/issue/${eventId}`),

  verifyCertificate: (code: string) => api.get(`/certificates/verify/${code}`),
};

/* ================= ADMIN API ================= */
export const adminService = {
  getPlatformMetrics: () => api.get('/admin/metrics'),
  getCommissionSettings: () => api.get('/admin/settings/commission'),
  updateCommissionSettings: (data: { defaultRatePercent: number; minPayoutInr?: number }) =>
    api.put('/admin/settings/commission', data),

  getStats: () => api.get('/admin/stats'),

  // Event Management (CRUD & Lifecycle)
  getAllEvents: (params?: any) => api.get('/admin/events', { params }),

  createEvent: (data: any) => api.post('/admin/events', data),

  updateEvent: (eventId: string, data: any) => api.put(`/admin/events/${eventId}`, data),

  updateEventStatus: (eventId: string, status: string) =>
    api.put(`/admin/events/${eventId}/status`, { status }),

  deleteEvent: (eventId: string) => api.delete(`/admin/events/${eventId}`),

  // Event Attendance & CSV Export
  getEventAttendance: (eventId: string, params?: any) =>
    api.get(`/admin/events/${eventId}/attendance`, { params }),

  updateAttendanceStatus: (eventId: string, registrationId: string, status: string) =>
    api.put(`/admin/events/${eventId}/attendance/${registrationId}`, { status }),

  exportAttendanceCSV: (eventId: string) =>
    api.get(`/admin/events/${eventId}/attendance/export-csv`, { responseType: 'blob' }),

  getPendingEvents: () => api.get('/admin/events/pending'),

  approveEvent: (eventId: string) => api.put(`/admin/events/${eventId}/approve`),

  rejectEvent: (eventId: string, reason: string) =>
    api.put(`/admin/events/${eventId}/reject`, { reason }),

  getAllUsers: (params?: any) => api.get('/admin/users', { params }),

  toggleUserStatus: (userId: string) => api.put(`/admin/users/${userId}/toggle-status`),

  updateUserRole: (userId: string, role: string) =>
    api.put(`/admin/users/${userId}/role`, { role }),

  createAdminAccount: (data: any) => api.post('/admin/users/create-admin', data),

  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
};

/* ================= ANNOUNCEMENT & NOTIFICATION API ================= */
export const announcementService = {
  getAnnouncements: (params?: any) => api.get('/announcements', { params }),

  createAnnouncement: (data: any) => api.post('/announcements', data),
};

export const notificationService = {
  getMyNotifications: () => api.get('/notifications'),

  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),

  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
