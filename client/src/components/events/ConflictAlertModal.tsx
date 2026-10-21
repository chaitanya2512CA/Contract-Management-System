import React from 'react';
import { AlertTriangle, Clock, Calendar, MapPin, X } from 'lucide-react';
import { Button } from '../common/Button';

interface ConflictAlertModalProps {
  isOpen: boolean;
  candidateEventTitle: string;
  conflictingEvent: {
    _id: string;
    title: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    venue: string;
  } | null;
  isLoading?: boolean;
  onProceedAnyway: () => void;
  onClose: () => void;
}

export const ConflictAlertModal: React.FC<ConflictAlertModalProps> = ({
  isOpen,
  candidateEventTitle,
  conflictingEvent,
  isLoading = false,
  onProceedAnyway,
  onClose,
}) => {
  if (!isOpen || !conflictingEvent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Schedule Conflict Detected!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You are already registered for an event at the same time.
            </p>
          </div>
        </div>

        {/* Comparison Box */}
        <div className="mt-5 space-y-3">
          {/* Conflicting Event Box */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Already Registered
            </span>
            <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
              {conflictingEvent.title}
            </h4>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-rose-500" />
                {new Date(conflictingEvent.eventDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-rose-500" />
                {conflictingEvent.startTime} - {conflictingEvent.endTime}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                {conflictingEvent.venue}
              </span>
            </div>
          </div>

          {/* New Requested Event Box */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              New Requested Event
            </span>
            <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
              {candidateEventTitle}
            </h4>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Registering for overlapping events may affect your ability to attend both sessions and receive attendance verification. Are you sure you wish to proceed?
        </p>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel Registration
          </Button>
          <Button
            variant="primary"
            onClick={onProceedAnyway}
            isLoading={isLoading}
            className="bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500"
          >
            Register Anyway
          </Button>
        </div>
      </div>
    </div>
  );
};
