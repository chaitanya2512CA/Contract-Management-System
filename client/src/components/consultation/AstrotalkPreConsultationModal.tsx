import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  Clock,
  Sparkles,
  Lock,
  Wallet,
  PlusCircle,
  AlertCircle,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { LawyerProfile } from '../../types';
import { consultationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface AstrotalkPreConsultationModalProps {
  lawyer: LawyerProfile;
  initialMode?: 'chat' | 'call';
  isOpen: boolean;
  onClose: () => void;
}

export const AstrotalkPreConsultationModal: React.FC<AstrotalkPreConsultationModalProps> = ({
  lawyer,
  initialMode = 'chat',
  isOpen,
  onClose,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'chat' | 'call'>(initialMode);
  const [duration, setDuration] = useState<15 | 30 | 60>(15);
  const [legalDescription, setLegalDescription] = useState<string>('Immediate Legal Advice & Document Review');
  const [walletBalance, setWalletBalance] = useState<number>(1500);
  const [showWalletRecharged, setShowWalletRecharged] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Defensive pricing computations
  const fee15 = Number(lawyer?.consultation_fee_15 || 499);
  const fee30 = Number(lawyer?.consultation_fee_30 || 899);
  const fee60 = Number(lawyer?.consultation_fee_60 || 1499);

  const perMinute = Math.max(15, Math.round(fee15 / 15));

  const getSessionFee = () => {
    if (duration === 15) return fee15;
    if (duration === 60) return fee60;
    return fee30;
  };

  const sessionFee = getSessionFee();
  const maxMinsAvailable = Math.floor(walletBalance / perMinute);

  const handleRechargeWallet = () => {
    setWalletBalance((prev) => prev + 1000);
    setShowWalletRecharged(true);
    setTimeout(() => setShowWalletRecharged(false), 2500);
  };

  const handleStartConsultation = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=lawyers');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await consultationService.instantStart({
        lawyerId: lawyer.id,
        mode,
        durationMinutes: duration,
        legalIssueDescription: legalDescription || `Instant ${mode} consultation`,
      });

      if (res.data?.success && res.data?.booking?.id) {
        onClose();
        navigate(`/consultations/${res.data.booking.id}/room?mode=${mode}`);
      } else {
        throw new Error(res.data?.message || 'Failed to initialize session');
      }
    } catch (err: any) {
      console.error('Instant consultation start failed:', err);
      setError(err.response?.data?.message || 'Failed to start instant session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Zap className="h-4 w-4 fill-amber-500" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white sm:text-base">
                Astrotalk Instant Legal Consultation
              </h2>
              <p className="text-[11px] text-slate-500">Live 1-on-1 Attorney Privileged Session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Advocate Card Summary */}
        <div className="mt-4 flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40">
          <div className="relative">
            <img
              src={
                lawyer.avatar ||
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
              }
              alt={lawyer.full_name}
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-blue-600 shadow-sm"
            />
            {/* Live pulsing dot */}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-200" />
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{lawyer.full_name}</h3>
              {lawyer.is_verified && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">{lawyer.primary_specialty}</p>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-0.5 font-bold text-amber-500">
                <Star className="h-3 w-3 fill-amber-400" />
                {Number(lawyer.rating_avg || 4.9).toFixed(1)}
              </span>
              <span>•</span>
              <span>{lawyer.experience_years || 5} Years Exp.</span>
              <span>•</span>
              <span>{lawyer.total_consultations || 24} orders</span>
            </div>
          </div>
        </div>

        {/* Consultation Mode Selector */}
        <div className="mt-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Select Consultation Channel
          </label>
          <div className="mt-1.5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMode('chat')}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${
                mode === 'chat'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm dark:bg-blue-950/60 dark:text-blue-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Instant Chat (₹{perMinute}/min)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('call')}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${
                mode === 'call'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Instant Call (₹{perMinute}/min)</span>
            </button>
          </div>
        </div>

        {/* Duration Packages */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Session Duration
            </label>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              ⚡ Live rate: ₹{perMinute}/min
            </span>
          </div>

          <div className="mt-1.5 grid grid-cols-3 gap-2 text-center text-xs">
            <button
              type="button"
              onClick={() => setDuration(15)}
              className={`rounded-2xl border p-2.5 font-bold transition ${
                duration === 15
                  ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <p>15 mins</p>
              <p className="mt-0.5 text-[10px] font-normal opacity-90">₹{fee15}</p>
            </button>

            <button
              type="button"
              onClick={() => setDuration(30)}
              className={`rounded-2xl border p-2.5 font-bold transition ${
                duration === 30
                  ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <p>30 mins</p>
              <p className="mt-0.5 text-[10px] font-normal opacity-90">₹{fee30}</p>
            </button>

            <button
              type="button"
              onClick={() => setDuration(60)}
              className={`rounded-2xl border p-2.5 font-bold transition ${
                duration === 60
                  ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <p>60 mins</p>
              <p className="mt-0.5 text-[10px] font-normal opacity-90">₹{fee60}</p>
            </button>
          </div>
        </div>

        {/* Astrotalk Wallet Balance Bar */}
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-xs dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Wallet Balance: </span>
                <span className="font-extrabold text-amber-700 dark:text-amber-400">₹{walletBalance.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRechargeWallet}
              className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-amber-700"
            >
              <PlusCircle className="h-3 w-3" />
              <span>Add ₹1,000</span>
            </button>
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Talktime Available: ~{maxMinsAvailable} mins</span>
            {showWalletRecharged && (
              <span className="font-bold text-emerald-600 animate-pulse">✓ ₹1,000 added to wallet!</span>
            )}
          </div>
        </div>

        {/* Optional Brief Inquiry */}
        <div className="mt-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Legal Matter / Topic (Optional)
          </label>
          <input
            type="text"
            value={legalDescription}
            onChange={(e) => setLegalDescription(e.target.value)}
            placeholder="e.g. Contract review, Bail notice query, Cyber fraud..."
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Pricing Summary Breakdown */}
        <div className="mt-4 space-y-1 rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-800/50">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Consultation Fee ({duration} mins)</span>
            <span className="font-bold text-slate-900 dark:text-white">₹{sessionFee}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Platform Service Fee</span>
            <span className="font-bold text-emerald-600 line-through text-[11px]">₹99</span>
            <span className="font-bold text-emerald-600">FREE</span>
          </div>
          <div className="border-t border-slate-200 pt-1.5 flex justify-between font-extrabold text-slate-900 dark:text-white">
            <span>Total Payable</span>
            <span className="text-sm text-blue-700 dark:text-blue-400">₹{sessionFee}</span>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Direct Action Confirmation */}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleStartConsultation}
            className={`w-2/3 flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-extrabold text-white shadow-lg transition disabled:opacity-50 ${
              mode === 'chat'
                ? 'bg-blue-700 hover:bg-blue-800 shadow-blue-200 dark:shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'
            }`}
          >
            {isLoading ? (
              <span>Connecting with Advocate...</span>
            ) : mode === 'chat' ? (
              <>
                <MessageSquare className="h-4 w-4" />
                <span>Start Chat with {lawyer.full_name?.split(' ')[1] || 'Advocate'}</span>
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <Phone className="h-4 w-4" />
                <span>Start Call with {lawyer.full_name?.split(' ')[1] || 'Advocate'}</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          <span>Encrypted with 100% Client-Attorney Privilege</span>
        </p>
      </div>
    </div>
  );
};
