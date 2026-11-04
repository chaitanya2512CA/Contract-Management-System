import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  Lock,
  Wallet,
  PlusCircle,
  AlertCircle,
  ChevronRight,
  Zap,
  Radio,
  Loader2,
} from 'lucide-react';
import { LawyerProfile } from '../../types';
import { consultationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'chat' | 'call'>(initialMode);
  const [duration, setDuration] = useState<15 | 30 | 60>(15);
  const [legalDescription, setLegalDescription] = useState<string>('Immediate Legal Advice & Consultation');
  const [walletBalance, setWalletBalance] = useState<number>(1500);
  const [showWalletRecharged, setShowWalletRecharged] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Request & Accept flow states
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState<boolean>(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const pollTimerRef = useRef<any>(null);

  // Sync initial mode
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Clean up polling interval when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  // Reset internal states when modal closes
  const handleModalClose = async () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (isWaitingForAcceptance && activeRequestId) {
      try {
        await consultationService.cancelRequest(activeRequestId);
      } catch (err) {
        // Silently ignore cancellation errors on close
      }
    }
    setIsWaitingForAcceptance(false);
    setActiveRequestId(null);
    setIsLoading(false);
    setError(null);
    onClose();
  };

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

  // Start polling consultation_requests status
  const startPollingRequest = (requestId: string) => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await consultationService.getRequestStatus(requestId);
        if (res.data?.success) {
          const status = res.data.status;
          if (status === 'accepted') {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            setIsWaitingForAcceptance(false);
            const targetId = res.data.bookingId || requestId;
            onClose();
            navigate(`/consultation/${mode}/${targetId}`);
          } else if (status === 'declined') {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            setIsWaitingForAcceptance(false);
            setActiveRequestId(null);
            setError('Advocate is currently unavailable. Please try another advocate.');
          }
        }
      } catch (pollErr: any) {
        console.error('Error polling request status:', pollErr);
      }
    }, 3000);
  };

  // Send Consultation Request
  const handleSendRequest = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=lawyers');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await consultationService.createRequest({
        advocateId: lawyer.id,
        mode,
        durationMinutes: duration,
        ratePerMin: perMinute,
      });

      if (res.data?.success && res.data?.request?.id) {
        const newReqId = res.data.request.id;
        setActiveRequestId(newReqId);
        setIsWaitingForAcceptance(true);
        startPollingRequest(newReqId);
      } else {
        throw new Error(res.data?.message || 'Failed to dispatch consultation request');
      }
    } catch (err: any) {
      console.error('Consultation request failed:', err);
      setError(err.response?.data?.message || 'Failed to send consultation request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel Pending Request
  const handleCancelRequest = async () => {
    if (!activeRequestId) {
      setIsWaitingForAcceptance(false);
      return;
    }

    try {
      setIsCancelling(true);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      await consultationService.cancelRequest(activeRequestId);
    } catch (err: any) {
      console.error('Cancel request error:', err);
    } finally {
      setIsCancelling(false);
      setIsWaitingForAcceptance(false);
      setActiveRequestId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#262118] bg-[#121212] p-6 shadow-2xl text-[#F5E6C4] my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262118] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#262118] bg-[#1A1A1A] text-[#D4AF37]">
              <Zap className="h-4 w-4 fill-[#D4AF37]" />
            </span>
            <div>
              <h2 className="text-sm font-black text-white sm:text-base">
                {isWaitingForAcceptance ? 'Consultation Request Dispatched' : 'Instant Advocate Consultation'}
              </h2>
              <p className="text-[11px] text-[#A39E93]">
                {isWaitingForAcceptance
                  ? 'Awaiting direct confirmation from advocate'
                  : 'Live 1-on-1 Attorney Privileged Session'}
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="rounded-full p-1.5 text-[#A39E93] transition hover:bg-[#1A1A1A] hover:text-[#D4AF37]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* WAITING SCREEN (Astrotalk Pulsing Radar) */}
        {isWaitingForAcceptance ? (
          <div className="py-6 flex flex-col items-center text-center">
            {/* Animated Radar Pulse Container */}
            <div className="relative flex items-center justify-center my-6">
              <span className="absolute h-28 w-28 rounded-full bg-[#D4AF37]/15 animate-ping duration-1000" />
              <span className="absolute h-36 w-36 rounded-full border border-[#D4AF37]/20 animate-pulse" />
              <div className="relative h-20 w-20 rounded-2xl overflow-hidden ring-4 ring-[#D4AF37] shadow-xl z-10 bg-[#1A1A1A]">
                <img
                  src={
                    lawyer.avatar ||
                    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
                  }
                  alt={lawyer.full_name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#1A1A1A] px-3 py-1 text-xs font-bold text-[#D4AF37] mb-3">
              <Radio className="h-3.5 w-3.5 animate-pulse text-[#D4AF37]" />
              <span>Live Notification Sent</span>
            </div>

            <h3 className="text-base font-black text-white">
              Request sent to {lawyer.full_name}
            </h3>
            <p className="mt-1.5 text-xs text-[#A39E93] max-w-sm">
              Waiting for advocate to accept your {mode === 'call' ? 'Call' : 'Chat'} consultation request...
            </p>

            {/* Request Summary Card */}
            <div className="mt-5 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] p-4 text-xs text-left space-y-2">
              <div className="flex items-center justify-between text-[#A39E93]">
                <span>Consultation Mode</span>
                <span className="font-bold text-[#D4AF37] capitalize flex items-center gap-1">
                  {mode === 'call' ? <Phone className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                  Instant {mode === 'call' ? 'Call' : 'Chat'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#A39E93]">
                <span>Advocate Rate</span>
                <span className="font-black text-white">₹{perMinute}/min</span>
              </div>
              <div className="flex items-center justify-between text-[#A39E93]">
                <span>Requested Duration</span>
                <span className="font-bold text-[#F5E6C4]">{duration} Mins</span>
              </div>
              <div className="border-t border-[#262118] pt-2 flex items-center justify-between font-bold text-white">
                <span>Estimated Session Fee</span>
                <span className="text-[#D4AF37]">₹{sessionFee}</span>
              </div>
            </div>

            {/* Pulsing Status Banner */}
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#A39E93]">
              <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
              <span>Advocate screen is ringing. Please stay on this page...</span>
            </div>

            {/* Cancel Button */}
            <div className="mt-6 w-full">
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelRequest}
                className="w-full rounded-2xl border border-rose-900/40 bg-rose-950/20 py-3 text-xs font-bold text-rose-300 transition hover:bg-rose-900/40 active:scale-95 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling Request...' : 'Cancel Request'}
              </button>
            </div>
          </div>
        ) : (
          /* PRE-CONSULTATION CONFIGURATION SCREEN */
          <>
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
                  <span>{lawyer.total_consultations || 24} consultations</span>
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
                Legal Matter / Inquiry (Optional)
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

            {/* Action Buttons */}
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleModalClose}
                className="w-1/3 rounded-2xl border border-[#262118] bg-[#1A1A1A] py-3 text-xs font-bold text-[#A39E93] transition hover:text-[#F5E6C4] hover:border-[#D4AF37]/50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleSendRequest}
                className="w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] py-3 text-xs font-black text-[#080808] shadow-lg shadow-[#D4AF37]/15 transition hover:bg-[#AA7C11] active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Dispatching Request...
                  </span>
                ) : (
                  <>
                    {mode === 'call' ? <Phone className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                    <span>Send Consultation Request</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <p className="mt-3 text-center text-[10px] text-[#A39E93] flex items-center justify-center gap-1">
              <Lock className="h-3 w-3 text-[#D4AF37]" />
              <span>Encrypted with 100% Client-Attorney Privilege</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
