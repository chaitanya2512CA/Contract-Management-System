import React, { useState } from 'react';
import { QrCode, CheckCircle2, AlertCircle, X, Search, ShieldCheck } from 'lucide-react';
import { attendanceService } from '../../services/api';
import { Button } from '../common/Button';

interface QRScannerModalProps {
  isOpen: boolean;
  eventId?: string;
  onClose: () => void;
  onAttendanceSuccess?: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  eventId,
  onClose,
  onAttendanceSuccess,
}) => {
  const [ticketInput, setTicketInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    alreadyMarked?: boolean;
    attendee?: any;
  } | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ticketInput.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await attendanceService.verifyAndMarkAttendance(ticketInput.trim(), eventId);
      setResult(res.data);
      if (res.data.success && onAttendanceSuccess) {
        onAttendanceSuccess();
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.response?.data?.message || 'Verification failed. Invalid or unrecognized ticket code.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTicketInput('');
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Attendance Verification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scan attendee QR code or enter ticket pass code
            </p>
          </div>
        </div>

        {/* Camera Scanner Viewfinder simulation */}
        <div className="mt-5 relative flex h-40 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-indigo-300 bg-slate-50 dark:border-indigo-800 dark:bg-slate-800/40">
          <div className="relative h-28 w-28 rounded-xl border-2 border-indigo-600 dark:border-indigo-400">
            {/* Animated Laser Bar */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-bounce" />
          </div>
          <span className="mt-2 text-[11px] font-semibold text-slate-400">
            Ready for QR Pass scanning
          </span>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={handleVerify} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ticket Pass Code / QR String
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="e.g. CP-2026-A8F93B"
                className="w-full font-mono uppercase rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
              <Button variant="primary" type="submit" isLoading={isLoading}>
                Verify
              </Button>
            </div>
          </div>
        </form>

        {/* Result Feedback Banner */}
        {result && (
          <div
            className={`mt-4 rounded-xl p-4 text-xs ${
              result.success
                ? result.alreadyMarked
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <div className="flex-1">
                <p className="font-bold">{result.message}</p>
                {result.attendee && (
                  <div className="mt-2 space-y-0.5 text-[11px] opacity-90 border-t border-slate-200/40 pt-1.5 dark:border-slate-700/40">
                    <p>
                      <strong>Attendee:</strong> {result.attendee.name} ({result.attendee.studentId || 'N/A'})
                    </p>
                    <p>
                      <strong>Department:</strong> {result.attendee.department}
                    </p>
                    <p>
                      <strong>Ticket:</strong> {result.attendee.ticketCode}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="font-bold underline hover:opacity-80"
              >
                Scan Next Attendee
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
