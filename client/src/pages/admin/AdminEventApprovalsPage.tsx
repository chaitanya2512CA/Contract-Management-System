import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  User,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { adminService } from '../../services/api';
import { CollegeEvent } from '../../types';
import { CategoryBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminEventApprovalsPage: React.FC = () => {
  const [pendingEvents, setPendingEvents] = useState<CollegeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<CollegeEvent | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPendingEvents();
      if (res.data.success) {
        setPendingEvents(res.data.events || []);
      }
    } catch (err) {
      console.error('Failed to load pending events', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (eventId: string, title: string) => {
    setIsProcessing(true);
    setActionSuccess('');
    try {
      await adminService.approveEvent(eventId);
      setActionSuccess(`"${title}" has been approved and published to the campus hub.`);
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchPending();
    } catch (err) {
      console.error('Approval failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;

    setIsProcessing(true);
    try {
      await adminService.rejectEvent(rejectTarget._id, rejectReason.trim());
      setActionSuccess(`"${rejectTarget.title}" rejected with feedback sent to organizer.`);
      setTimeout(() => setActionSuccess(''), 4000);
      setRejectTarget(null);
      setRejectReason('');
      await fetchPending();
    } catch (err) {
      console.error('Rejection failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl font-serif">
          Event Moderation & Approvals
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Review proposals submitted by faculty, departments, and registered student club leaders.
        </p>
      </div>

      {actionSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : pendingEvents.length === 0 ? (
        <EmptyState
          title="Approval Queue Cleared"
          description="There are currently no proposed events awaiting administrative review."
        />
      ) : (
        <div className="space-y-5">
          {pendingEvents.map((event) => {
            const organizer: any = event.organizer;

            return (
              <div
                key={event._id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="p-6">
                  {/* Top Tags & Category */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={event.category} />
                      <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-0.5 text-xs font-semibold">
                        ⏳ Moderation Required
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Submitted on {new Date(event.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Left: Thumbnail & Organizer */}
                    <div className="space-y-3 md:col-span-1">
                      <img
                        src={event.bannerImage}
                        alt={event.title}
                        className="h-32 w-full rounded-xl object-cover"
                      />
                      <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Organizer Profile
                        </span>
                        <p className="mt-1 font-bold text-slate-900 dark:text-white">
                          {organizer?.name || event.organizerName}
                        </p>
                        <p className="text-[11px] text-slate-500">{organizer?.email}</p>
                        <p className="text-[11px] text-slate-400">{organizer?.department}</p>
                      </div>
                    </div>

                    {/* Middle: Event Description & Metadata */}
                    <div className="space-y-3 md:col-span-3 flex flex-col justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {event.title}
                        </h2>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {event.description}
                        </p>

                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300">
                          <div>
                            <span className="text-[10px] text-slate-400">Schedule</span>
                            <p className="font-semibold">{new Date(event.eventDate).toLocaleDateString()}</p>
                            <p className="text-[11px] text-slate-400">{event.startTime} - {event.endTime}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">Location</span>
                            <p className="font-semibold">{event.venue}</p>
                            <p className="text-[11px] text-slate-400 capitalize">{event.venueType}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">Capacity & Pricing</span>
                            <p className="font-semibold">{event.maxCapacity} Seats</p>
                            <p className="text-[11px] text-slate-400">
                              {event.isPaid ? `$${event.ticketPrice} Fee` : 'Free Entry'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setRejectTarget(event)}
                          disabled={isProcessing}
                          leftIcon={<XCircle className="h-4 w-4" />}
                        >
                          Reject Proposal
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(event._id, event.title)}
                          isLoading={isProcessing}
                          leftIcon={<CheckCircle className="h-4 w-4" />}
                        >
                          Approve & Publish to Campus
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal with feedback message */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reject Event Proposal
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Provide feedback for "{rejectTarget.title}". This feedback will be sent directly to the organizer.
            </p>

            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Feedback / Reason for Rejection *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Schedule clashes with university examination week; please choose an alternative date."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setRejectTarget(null)}>
                  Cancel
                </Button>
                <Button variant="danger" type="submit" isLoading={isProcessing}>
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
