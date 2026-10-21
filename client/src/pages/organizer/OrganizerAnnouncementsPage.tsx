import React, { useState, useEffect } from 'react';
import { Megaphone, PlusCircle, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { announcementService, eventService } from '../../services/api';
import { Announcement, CollegeEvent } from '../../types';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const OrganizerAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [annRes, evRes] = await Promise.all([
        announcementService.getAnnouncements(),
        eventService.getMyOrganizedEvents(),
      ]);
      if (annRes.data.success) setAnnouncements(annRes.data.announcements || []);
      if (evRes.data.success) setEvents(evRes.data.events || []);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      await announcementService.createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        eventId: selectedEventId || null,
        priority,
        isPinned,
      });

      setTitle('');
      setContent('');
      setSelectedEventId('');
      setSuccessMessage('Announcement broadcasted successfully to all target students!');
      setTimeout(() => setSuccessMessage(''), 4000);
      await loadData();
    } catch (err) {
      console.error('Broadcast failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Event Announcements & Broadcasts
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Publish schedule changes, prerequisite reminders, or competition updates to enrolled students.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Broadcast Form */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-indigo-600" />
          Compose New Announcement
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Announcement Title / Subject *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hackathon Team Formations & Check-in Desk Location"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Specific Event (Optional)
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white cursor-pointer"
              >
                <option value="">General / College-Wide Announcement</option>
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white cursor-pointer"
              >
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Alert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Message Content *
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide comprehensive instructions, venue updates, or important guidelines..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Pin to top of student announcements</span>
            </label>

            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Dispatch Announcement
            </Button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
          Published Announcements History
        </h2>

        {isLoading ? (
          <TableSkeleton rows={3} />
        ) : announcements.length === 0 ? (
          <EmptyState
            title="No announcements published yet"
            description="Use the form above to broadcast notices to your event attendees."
          />
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{ann.title}</h3>
                    {ann.eventTitle && (
                      <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        Event: {ann.eventTitle}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(ann.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {ann.content}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                  <span>Author: {ann.authorName} ({ann.authorRole})</span>
                  <span>•</span>
                  <span className="capitalize">{ann.priority} Priority</span>
                  {ann.isPinned && <span>• Pinned</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
