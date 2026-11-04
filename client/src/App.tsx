import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Guard
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { StudentLayout } from './components/layout/StudentLayout';
import { OrganizerLayout } from './components/layout/OrganizerLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages (ContractIQ)
import { LandingPage } from './pages/public/LandingPage';
import { LawyerDirectoryPage } from './pages/marketplace/LawyerDirectoryPage';
import { LegalServicesPage } from './pages/marketplace/LegalServicesPage';

// ContractIQ Auth Pages
import { UniversalLoginPage } from './pages/auth/UniversalLoginPage';
import { UniversalRegisterPage } from './pages/auth/UniversalRegisterPage';

// ContractIQ Dashboards & Workspaces
import { ClientDashboard } from './pages/client/ClientDashboard';
import { LawyerDashboard } from './pages/lawyer/LawyerDashboard';
import { LawyerProfilePage } from './pages/lawyer/LawyerProfilePage';
import { BusinessDashboard } from './pages/business/BusinessDashboard';
import { ContractIQAdminDashboard } from './pages/admin/ContractIQAdminDashboard';

// ContractIQ CLM, Cases & Consultations
import { ContractDetailsPage } from './pages/contracts/ContractDetailsPage';
import { CasesListPage } from './pages/cases/CasesListPage';
import { CaseDetailsPage } from './pages/cases/CaseDetailsPage';
import { ConsultationRoomPage } from './pages/consultation/ConsultationRoomPage';

// Legacy Event Management Pages (Preserved for compatibility)
import { ExploreEventsPage } from './pages/public/ExploreEventsPage';
import { EventDetailsPage } from './pages/public/EventDetailsPage';
import { VerifyCertificatePage } from './pages/public/VerifyCertificatePage';
import { NotFoundPage } from './pages/public/NotFoundPage';

import { StudentLoginPage } from './pages/auth/StudentLoginPage';
import { StudentRegisterPage } from './pages/auth/StudentRegisterPage';
import { OrganizerLoginPage } from './pages/auth/OrganizerLoginPage';
import { OrganizerRegisterPage } from './pages/auth/OrganizerRegisterPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

import { StudentDashboard } from './pages/student/StudentDashboard';
import { MyRegistrationsPage } from './pages/student/MyRegistrationsPage';
import { StudentCalendarPage } from './pages/student/StudentCalendarPage';
import { MyCertificatesPage } from './pages/student/MyCertificatesPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { CreateEventPage } from './pages/organizer/CreateEventPage';
import { EditEventPage } from './pages/organizer/EditEventPage';
import { ManageEventRegistrationsPage } from './pages/organizer/ManageEventRegistrationsPage';
import { QRScanAttendancePage } from './pages/organizer/QRScanAttendancePage';
import { OrganizerAnnouncementsPage } from './pages/organizer/OrganizerAnnouncementsPage';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminEventApprovalsPage } from './pages/admin/AdminEventApprovalsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* ContractIQ Public & Marketplace Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/lawyers" element={<LawyerDirectoryPage />} />
      <Route path="/services" element={<LegalServicesPage />} />

      {/* ContractIQ Authentication */}
      <Route path="/login" element={<UniversalLoginPage />} />
      <Route path="/register" element={<UniversalRegisterPage />} />

      {/* ContractIQ Client Portal */}
      <Route
        path="/client/dashboard"
        element={
          <ProtectedRoute allowedRoles={['client', 'admin']}>
            <ClientDashboard />
          </ProtectedRoute>
        }
      />

      {/* ContractIQ Lawyer Portal */}
      <Route
        path="/lawyer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['lawyer', 'admin']}>
            <LawyerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lawyer/profile"
        element={
          <ProtectedRoute allowedRoles={['lawyer', 'admin']}>
            <LawyerProfilePage />
          </ProtectedRoute>
        }
      />

      {/* ContractIQ Business & CLM Portal */}
      <Route
        path="/business/dashboard"
        element={
          <ProtectedRoute allowedRoles={['business', 'admin', 'lawyer', 'client']}>
            <BusinessDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contracts"
        element={
          <ProtectedRoute allowedRoles={['business', 'admin', 'lawyer', 'client']}>
            <BusinessDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contracts/:id"
        element={
          <ProtectedRoute allowedRoles={['business', 'admin', 'lawyer', 'client']}>
            <ContractDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* ContractIQ Legal Cases */}
      <Route
        path="/cases"
        element={
          <ProtectedRoute allowedRoles={['lawyer', 'client', 'business', 'admin']}>
            <CasesListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:id"
        element={
          <ProtectedRoute allowedRoles={['lawyer', 'client', 'business', 'admin']}>
            <CaseDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* ContractIQ Real-time Consultation Room */}
      <Route
        path="/consultations/:id/room"
        element={
          <ProtectedRoute allowedRoles={['lawyer', 'client', 'business', 'admin']}>
            <ConsultationRoomPage />
          </ProtectedRoute>
        }
      />

      {/* ContractIQ Admin Portal */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ContractIQAdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Legacy Event Pages */}
      <Route path="/events" element={<ExploreEventsPage />} />
      <Route path="/events/:id" element={<EventDetailsPage />} />
      <Route path="/calendar" element={<StudentCalendarPage />} />
      <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
      <Route path="/verify/:code" element={<VerifyCertificatePage />} />

      {/* Legacy Auth Portals */}
      <Route path="/student/login" element={<StudentLoginPage />} />
      <Route path="/student/register" element={<StudentRegisterPage />} />
      <Route path="/organizer/login" element={<OrganizerLoginPage />} />
      <Route path="/organizer/register" element={<OrganizerRegisterPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Legacy Student Protected Portal */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['student', 'organizer', 'admin']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/my-events" element={<MyRegistrationsPage />} />
        <Route path="/certificates" element={<MyCertificatesPage />} />
        <Route path="/profile" element={<StudentProfilePage />} />
      </Route>

      {/* Legacy Organizer Protected Portal */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['organizer', 'admin']}>
            <OrganizerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
        <Route path="/organizer/create-event" element={<CreateEventPage />} />
        <Route path="/organizer/edit-event/:id" element={<EditEventPage />} />
        <Route path="/organizer/events/:id/roster" element={<ManageEventRegistrationsPage />} />
        <Route path="/organizer/attendance-scanner" element={<QRScanAttendancePage />} />
        <Route path="/organizer/announcements" element={<OrganizerAnnouncementsPage />} />
      </Route>

      {/* Legacy Admin Protected Portal Sub-pages */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/legacy-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/events" element={<AdminEventsPage />} />
        <Route path="/admin/approvals" element={<AdminEventApprovalsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
export default App;
