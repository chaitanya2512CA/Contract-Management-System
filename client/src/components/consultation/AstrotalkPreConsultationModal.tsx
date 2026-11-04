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
  const ratingAvg = (Number(lawyer?.rating_avg) || 4.9).toFixed(1);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#262118] bg-[#121212] p-6 shadow-2xl text-[#F5E6C4] my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262118] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#262118] bg-[#1A1A1A] text-[#D4AF37]">
              <Zap className="h-4 w-4 fill-[#D4AF37]" />
            </span>
            <div>
              <h2 className="text-sm font-black text-white sm:text-base">
                Instant Advocate Consultation
              </h2>
              <p className="text-[11px] text-[#A39E93]">Live 1-on-1 Attorney Privileged Session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#A39E93] transition hover:bg-[#1A1A1A] hover:text-[#D4AF37]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Advocate Card Summary */}
        <div className="mt-4 flex items-start gap-3.5 rounded-2xl border border-[#262118] bg-[#1A1A1A] p-4">
          <div className="relative shrink-0">
            <img
              src={
                lawyer.avatar ||
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
              }
              alt={lawyer.full_name}
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-[#D4AF37]/70 shadow-sm"
            />
            {/* Live pulsing dot */}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#10B981] ring-2 ring-[#1A1A1A]">
              <span className="h-2 w-2 animate-ping rounded-full bg-[#10B981]" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-sm font-bold text-white truncate">{lawyer.full_name}</h3>
              {lawyer.is_verified && (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-[#D4AF37]/30 bg-[#121212] px-2 py-0.5 text-[9px] font-bold text-[#D4AF37] shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-[#D4AF37] truncate mt-0.5">{lawyer.primary_specialty}</p>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#A39E93]">
              <span className="flex items-center gap-0.5 font-bold text-[#F5E6C4]">
                <Star className="h-3 w-3 fill-[#D4AF37] text-[#D4AF37]" />
                ★ {ratingAvg}
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
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#A39E93]">
            Select Consultation Channel
          </label>
          <div className="mt-1.5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMode('chat')}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${
                mode === 'chat'
                  ? 'border-[#D4AF37] bg-[#1A1A1A] text-[#D4AF37] shadow-sm'
                  : 'border-[#262118] bg-[#121212] text-[#A39E93] hover:border-[#D4AF37]/40 hover:text-[#F5E6C4]'
              }`}
            >
              <MessageSquare className="h-4 w-4 text-[#D4AF37]" />
              <span>Instant Chat (₹{perMinute}/min)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('call')}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${
                mode === 'call'
                  ? 'border-[#D4AF37] bg-[#D4AF37] text-[#080808] font-black shadow-sm'
                  : 'border-[#262118] bg-[#121212] text-[#A39E93] hover:border-[#D4AF37]/40 hover:text-[#F5E6C4]'
              }`}
            >
              <Phone className="h-4 w-4" />
              <span>Instant Call (₹{perMinute}/min)</span>
            </button>
          </div>
        </div>

        {/* Duration Packages */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#A39E93]">
              Session Duration
            </label>
            <span className="text-[11px] font-bold text-[#D4AF37]">
              ⚡ Live rate: ₹{perMinute}/min
            </span>
          </div>

          <div className="mt-1.5 grid grid-cols-3 gap-2 text-center text-xs">
            <button
              type="button"
              onClick={() => setDuration(15)}
              className={`rounded-2xl border p-2.5 font-bold transition ${
                duration === 15
                  ? 'border-[#D4AF37] bg-[#D4AF37] text-[#080808] font-black shadow-md'
                  : 'border-[#262118] bg-[#1A1A1A] text-[#F5E6C4] hover:border-[#D4AF37]'
              }`}
            >
              <p>15 mins</p>
              <p className="mt-0.5 text-[10px] opacity-90">₹{fee15}</p>
            </button>

            <button
              type="button"
              onClick={() => setDuration(30)}
              className={`rounded-2xl border p-2.5 font-bold transition ${
                duration === 30
                  ? 'border-[#D4AF37] bg-[#D4AF37] text-[#080808] font-black shadow-md'
                  : 'border-[#262118] bg-[#1A1A1A] text-[#F5E6C4] hover:border-[#D4AF37]'
              }`}
            >
              <p>30 mins</p>
              <p className="mt-0.5 text-[10px] opacity-90">₹{fee30}</p>
            </button>

            <button
              type="button"
              onClick={() => setDuration(60)}
              className={`rounded-2xl border p-2.5 font-bold transition ${
                duration === 60
                  ? 'border-[#D4AF37] bg-[#D4AF37] text-[#080808] font-black shadow-md'
                  : 'border-[#262118] bg-[#1A1A1A] text-[#F5E6C4] hover:border-[#D4AF37]'
              }`}
            >
              <p>60 mins</p>
              <p className="mt-0.5 text-[10px] opacity-90">₹{fee60}</p>
            </button>
          </div>
        </div>

        {/* Astrotalk Wallet Balance Bar */}
        <div className="mt-4 rounded-2xl border border-[#262118] bg-[#1A1A1A] p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#D4AF37]" />
              <div>
                <span className="font-semibold text-[#A39E93]">Wallet Balance: </span>
                <span className="font-black text-[#D4AF37]">₹{(Number(walletBalance) || 0).toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRechargeWallet}
              className="inline-flex items-center gap-1 rounded-xl bg-[#D4AF37] px-3 py-1 text-[11px] font-bold text-[#080808] shadow-sm hover:bg-[#AA7C11] transition"
            >
              <PlusCircle className="h-3 w-3" />
              <span>Add ₹1,000</span>
            </button>
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#A39E93]">
            <span>Talktime Available: ~{maxMinsAvailable} mins</span>
            {showWalletRecharged && (
              <span className="font-bold text-[#10B981] animate-pulse">✓ ₹1,000 added to wallet!</span>
            )}
          </div>
        </div>

        {/* Optional Brief Inquiry */}
        <div className="mt-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#A39E93]">
            Legal Matter / Topic (Optional)
          </label>
          <input
            type="text"
            value={legalDescription}
            onChange={(e) => setLegalDescription(e.target.value)}
            placeholder="e.g. Contract review, Bail notice query, Cyber fraud..."
            className="mt-1 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] px-3.5 py-2.5 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none transition"
          />
        </div>

        {/* Pricing Summary Breakdown */}
        <div className="mt-4 space-y-1.5 rounded-2xl border border-[#262118] bg-[#1A1A1A] p-3.5 text-xs">
          <div className="flex justify-between text-[#A39E93]">
            <span>Consultation Fee ({duration} mins)</span>
            <span className="font-bold text-white">₹{sessionFee}</span>
          </div>
          <div className="flex justify-between text-[#A39E93]">
            <span>Platform Service Fee</span>
            <span className="font-bold text-[#10B981] line-through text-[11px]">₹99</span>
            <span className="font-bold text-[#10B981]">FREE</span>
          </div>
          <div className="border-t border-[#262118] pt-2 flex justify-between font-extrabold text-white">
            <span>Total Payable</span>
            <span className="text-sm font-black text-[#D4AF37]">₹{sessionFee}</span>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-900/60 p-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Direct Action Confirmation */}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 rounded-2xl border border-[#262118] bg-[#1A1A1A] py-3 text-xs font-bold text-[#A39E93] transition hover:text-[#F5E6C4] hover:border-[#D4AF37]/50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleStartConsultation}
            className="w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] py-3 text-xs font-black text-[#080808] shadow-lg shadow-[#D4AF37]/15 transition hover:bg-[#AA7C11] active:scale-95 disabled:opacity-50"
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

        <p className="mt-3 text-center text-[10px] text-[#A39E93] flex items-center justify-center gap-1">
          <Lock className="h-3 w-3 text-[#D4AF37]" />
          <span>Encrypted with 100% Client-Attorney Privilege</span>
        </p>
      </div>
    </div>
  );
};
