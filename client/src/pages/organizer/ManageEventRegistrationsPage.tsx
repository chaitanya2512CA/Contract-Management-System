import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Download,
  QrCode,
  Award,
  Megaphone,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Registration, CollegeEvent } from '../../types';
import { registrationService, eventService, certificateService, announcementService } from '../../services/api';
import { StatusBadge, CategoryBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { QRScannerModal } from '../../components/scanner/QRScannerModal';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const ManageEventRegistrationsPage: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>();

  const [event, setEvent] = useState<CollegeEvent | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Actions state
  const [showScanner, setShowScanner] = useState(false);
  const [isIssuingCerts, setIsIssuingCerts] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Broadcast modal state
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const fetchRoster = async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const [evRes, rosterRes] = await Promise.all([
        eventService.getEventById(eventId),
        registrationService.getEventParticipants(eventId),
      ]);

      if (evRes.data.success) setEvent(evRes.data.event);
      if (rosterRes.data.success) setRegistrations(rosterRes.data.registrations || []);
    } catch (err) {
      console.error('Failed to load event roster', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [eventId]);

  const handleExportCSV = async () => {
    if (!eventId || !event) return;
    try {
      const res = await registrationService.exportParticipantsCSV(eventId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Attendees.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  const handleIssueCertificates = async () => {
    if (!eventId) return;
    setIsIssuingCerts(true);
    setActionMessage(null);

    try {
      const res = await certificateService.issueCertificatesForEvent(eventId);
      setActionMessage({ text: res.data.message || 'Certificates successfully dispatched!', isError: false });
      await fetchRoster();
    } catch (err: any) {
      setActionMessage({
        text: err.response?.data?.message || 'Error issuing certificates.',
        isError: true,
      });
    } finally {
      setIsIssuingCerts(false);
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !announcementTitle || !announcementContent) return;

    setIsBroadcasting(true);
    try {
      await announcementService.createAnnouncement({
        title: announcementTitle,
        content: announcementContent,
        eventId,
        priority: 'high',
        targetAudience: 'registered_participants',
      });
      setShowBroadcast(false);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setActionMessage({ text: 'Announcement broadcasted to all event participants.', isError: false });
    } catch (err: any) {
      console.error('Broadcast failed', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Filtered registrations
  const filtered = registrations.filter((r) => {
    const matchesSearch =
      !search ||
      r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      r.ticketCode?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRegistered = registrations.filter((r) => r.status === 'registered' || r.status === 'attended').length;
  const attendedCount = registrations.filter((r) => r.status === 'attended').length;
  const waitlistCount = registrations.filter((r) => r.status === 'waitlisted').length;
  const attendanceRate = totalRegistered > 0 ? Math.round((attendedCount / totalRegistered) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Back button & Header */}
      <div>
        <Link
          to="/organizer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Organizer Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {event?.title || 'Participant Roster & Entry Control'}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {event?.venue} • {event ? new Date(event.eventDate).toLocaleDateString() : ''} • {event?.startTime}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBroadcast(true)}
              leftIcon={<Megaphone className="h-4 w-4" />}
            >
              Broadcast Notice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScanner(true)}
              leftIcon={<QrCode className="h-4 w-4 text-indigo-600" />}
            >
              Scan Tickets
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleIssueCertificates}
              isLoading={isIssuingCerts}
              leftIcon={<Award className="h-4 w-4" />}
            >
              Issue Certificates ({attendedCount})
            </Button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`rounded-xl p-3.5 text-xs flex items-center gap-2 ${
            actionMessage.isError
              ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          }`}
        >
          {actionMessage.isError ? (
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-400">Total Registered</span>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {totalRegistered} / {event?.maxCapacity}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-400">Verified Attended</span>
          <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {attendedCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-400">Waitlist Queue</span>
          <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
            {waitlistCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-400">Turnout Rate</span>
          <p className="mt-1 text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {attendanceRate}%
          </p>
        </div>
      </div>

      {/* Participant Roster Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, ID, email, or pass..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="registered">Registered Only</option>
              <option value="attended">Attended Only</option>
              <option value="waitlisted">Waitlisted Only</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No attendees found"
            description="No registrations match your search criteria or filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Department & ID</th>
                  <th className="py-3 px-3">Ticket Pass</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Attended At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((reg) => (
                  <tr
                    key={reg._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            reg.user?.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
                          }
                          alt={reg.user?.name}
                          className="h-8 w-8 rounded-full object-cover shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {reg.user?.name}
                          </p>
                          <p className="text-[11px] text-slate-400">{reg.user?.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <p className="font-semibold">{reg.user?.studentId || 'N/A'}</p>
                      <p className="text-[11px] text-slate-400">{reg.user?.department}</p>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {reg.ticketCode}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="capitalize">{reg.registrationType}</span>
                      {reg.teamName && (
                        <span className="block text-[10px] text-purple-600 font-semibold">
                          {reg.teamName}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={reg.status} />
                    </td>

                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {reg.attendedAt ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ {new Date(reg.attendedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showScanner}
        eventId={eventId}
        onClose={() => setShowScanner(false)}
        onAttendanceSuccess={fetchRoster}
      />

      {/* Broadcast Announcement Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowBroadcast(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-600" />
              Broadcast Notice to Attendees
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              This message will be instantly delivered to all {totalRegistered} registered participants via app notifications.
            </p>

            <form onSubmit={handleBroadcastAnnouncement} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notice Subject
                </label>
                <input
                  type="text"
                  required
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g. Schedule Update or Bring Your Own Laptop"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Message Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Provide instructions, venue room updates, prerequisite software links, etc."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowBroadcast(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={isBroadcasting}>
                  Dispatch Broadcast Notice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
