import React, { useState, useEffect } from 'react';
import { Megaphone, PlusCircle, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { announcementService, eventService } from '../../services/api';
import { Announcement, CollegeEvent } from '../../types';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { validateText } from '../../utils/validation';

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
  const [errorMessage, setErrorMessage] = useState('');

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
    setErrorMessage('');
    setSuccessMessage('');

    const titleCheck = validateText(title, 'Announcement title', 3, 200, true);
    if (!titleCheck.isValid) {
      setErrorMessage(titleCheck.message);
      return;
    }

    const contentCheck = validateText(content, 'Announcement message', 3, 2000, true);
    if (!contentCheck.isValid) {
      setErrorMessage(contentCheck.message);
      return;
    }

    setIsSubmitting(true);

    try {
      await announcementService.createAnnouncement({
        title: titleCheck.normalized,
        content: contentCheck.normalized,
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
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Broadcast failed.');
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

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Announcement Title / Subject *
              </label>
              <span className={`text-[10px] ${title.length > 190 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                {title.length} / 200
              </span>
            </div>
            <input
              type="text"
              required
              minLength={3}
              maxLength={200}
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
                <option value="important">Important Priority</option>
                <option value="urgent">Urgent Alert</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Message Content *
              </label>
              <span className={`text-[10px] ${content.length > 1900 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                {content.length} / 2000
              </span>
            </div>
            <textarea
              required
              rows={4}
              minLength={3}
              maxLength={2000}
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
