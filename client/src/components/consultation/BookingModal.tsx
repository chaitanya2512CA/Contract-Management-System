import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Video,
  Phone,
  MessageSquare,
  Clock,
  Calendar,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  FileUp,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { LawyerProfile } from '../../types';
import { consultationService, paymentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface BookingModalProps {
  lawyer: LawyerProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ lawyer, isOpen, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'video' | 'audio' | 'chat'>('video');
  const [duration, setDuration] = useState<15 | 30 | 60>(30);
  const [dateOption, setDateOption] = useState<'today' | 'tomorrow' | 'later'>('today');
  const [timeSlot, setTimeSlot] = useState<string>('15:00');
  const [legalDescription, setLegalDescription] = useState<string>('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
  const [documentName, setDocumentName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate pricing based on duration
  const getFee = () => {
    if (duration === 15) return lawyer.consultation_fee_15 || 499;
    if (duration === 60) return lawyer.consultation_fee_60 || 1499;
    return lawyer.consultation_fee_30 || 899;
  };

  const consultationFee = getFee();
  const platformFee = 99; // Standard transparency fee
  const gst = Math.round((consultationFee + platformFee) * 0.18);
  const totalAmount = consultationFee + platformFee + gst;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=lawyers');
      return;
    }

    if (!legalDescription.trim()) {
      setError('Please provide a brief description of your legal situation.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Compute scheduled time
      const targetDate = new Date();
      if (dateOption === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (dateOption === 'later') {
        targetDate.setDate(targetDate.getDate() + 2);
      }
      const [hours, mins] = timeSlot.split(':');
      targetDate.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);

      // 1. Create Consultation Booking
      const bookingRes = await consultationService.create({
        lawyerId: lawyer.id,
        practiceArea: lawyer.primary_specialty,
        consultationMode: mode,
        durationMinutes: duration,
        scheduledStart: targetDate.toISOString(),
        legalIssueDescription: legalDescription,
        urgency,
        clientDocuments: documentName ? [{ title: documentName, url: 'https://example.com/doc.pdf' }] : [],
      });

      const booking = bookingRes.data.booking;

      // 2. Perform Instant Sandbox Payment Verification
      await paymentService.testCheckout(booking.id);

      // 3. Success Redirect
      onClose();
      navigate(`/consultations/${booking.id}/room`);
    } catch (err: any) {
      console.error('Booking failed:', err);
      setError(err.response?.data?.message || 'Failed to complete booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={
                lawyer.avatar ||
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
              }
              alt={lawyer.full_name}
              className="h-12 w-12 rounded-2xl object-cover ring-2 ring-blue-600"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{lawyer.full_name}</h3>
                {lawyer.is_verified && (
                  <Badge variant="success" className="text-[10px] py-0 px-1">
                    <ShieldCheck className="h-3 w-3 mr-0.5" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">{lawyer.primary_specialty}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleBooking} className="mt-4 space-y-5">
          {/* Step 1: Consultation Mode */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Choose Consultation Channel
            </label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMode('video')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-center transition ${
                  mode === 'video'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-800 ring-2 ring-blue-600 dark:bg-blue-950/30 dark:text-blue-300'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Video className="h-5 w-5 text-blue-600" />
                <span className="text-xs font-bold">Video Meeting</span>
                <span className="text-[10px] text-slate-500">Encrypted Call</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('audio')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-center transition ${
                  mode === 'audio'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-800 ring-2 ring-blue-600 dark:bg-blue-950/30 dark:text-blue-300'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Phone className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-bold">Audio Call</span>
                <span className="text-[10px] text-slate-500">In-App Voice</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('chat')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-center transition ${
                  mode === 'chat'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-800 ring-2 ring-blue-600 dark:bg-blue-950/30 dark:text-blue-300'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <span className="text-xs font-bold">Live Chat</span>
                <span className="text-[10px] text-slate-500">Instant Q&A</span>
              </button>
            </div>
          </div>

          {/* Step 2: Duration & Pricing */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Select Consultation Duration
            </label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {[
                { min: 15, label: '15 Minutes', price: lawyer.consultation_fee_15 || 499, tag: 'Quick Advice' },
                { min: 30, label: '30 Minutes', price: lawyer.consultation_fee_30 || 899, tag: 'Most Popular' },
                { min: 60, label: '60 Minutes', price: lawyer.consultation_fee_60 || 1499, tag: 'Deep Review' },
              ].map((tier) => (
                <button
                  key={tier.min}
                  type="button"
                  onClick={() => setDuration(tier.min as any)}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition ${
                    duration === tier.min
                      ? 'border-blue-600 bg-blue-50/70 text-blue-800 ring-2 ring-blue-600 dark:bg-blue-950/30 dark:text-blue-300'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold">{tier.label}</span>
                  <span className="text-base font-extrabold text-blue-700 dark:text-blue-400">₹{tier.price}</span>
                  <span className="mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {tier.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Date & Slot */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Appointment Time
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDateOption('today')}
                className={`rounded-xl border py-2 text-xs font-semibold ${
                  dateOption === 'today'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40'
                    : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDateOption('tomorrow')}
                className={`rounded-xl border py-2 text-xs font-semibold ${
                  dateOption === 'tomorrow'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40'
                    : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setDateOption('later')}
                className={`rounded-xl border py-2 text-xs font-semibold ${
                  dateOption === 'later'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40'
                    : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                In 2 Days
              </button>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-xs text-slate-500">Available Slots:</span>
              <div className="flex flex-wrap gap-1.5">
                {['11:00', '14:30', '16:00', '17:30', '19:00'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setTimeSlot(time)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                      timeSlot === time
                        ? 'bg-blue-700 text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 4: Legal Issue Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              4. Brief Summary of Legal Issue
            </label>
            <textarea
              required
              rows={3}
              value={legalDescription}
              onChange={(e) => setLegalDescription(e.target.value)}
              placeholder="e.g. Received a police notice / need contract indemnity review / commercial dispute settlement..."
              className="mt-1.5 w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Urgency:</span>
                <select
                  value={urgency}
                  onChange={(e: any) => setUrgency(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <option value="low">Standard (Low)</option>
                  <option value="medium">Normal (Medium)</option>
                  <option value="high">Urgent (High)</option>
                  <option value="emergency">Emergency (Within 2 hrs)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Optional document name..."
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Step 5: Transparent Razorpay Order Summary */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{duration}-Minute Legal Consultation Fee:</span>
              <span className="font-semibold text-slate-900 dark:text-white">₹{consultationFee.toFixed(2)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Platform Technology & Convenience Fee:</span>
              <span className="font-semibold text-slate-900 dark:text-white">₹{platformFee.toFixed(2)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>GST (18% Statutory):</span>
              <span className="font-semibold text-slate-900 dark:text-white">₹{gst.toFixed(2)}</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:text-white">
              <span>Total Payable:</span>
              <span className="text-base text-blue-700 dark:text-blue-400">₹{totalAmount.toFixed(2)}</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Secured by Razorpay • 100% Client-Attorney Confidentiality Guaranteed
            </p>
          </div>

          {/* Submit Action */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 rounded-2xl border border-slate-200 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-2/3 items-center justify-center gap-2 rounded-2xl bg-blue-700 py-3 text-xs font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-none"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Pay ₹{totalAmount} & Confirm Consultation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
