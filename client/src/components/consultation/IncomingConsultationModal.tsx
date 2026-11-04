import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Radio,
  Clock,
  Zap,
  Loader2,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { consultationService } from '../../services/api';

interface ConsultationRequestItem {
  id: string;
  client_id: string;
  advocate_id: string;
  mode: 'chat' | 'call';
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
  duration_minutes: number;
  rate_per_min: string | number;
  client_name?: string;
  client_email?: string;
  client_avatar?: string;
  created_at: string;
}

export const IncomingConsultationModal: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [incomingRequests, setIncomingRequests] = useState<ConsultationRequestItem[]>([]);
  const [isResponding, setIsResponding] = useState<boolean>(false);
  const pollIntervalRef = useRef<any>(null);

  // Poll for incoming requests only if authenticated lawyer
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'lawyer') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIncomingRequests([]);
      return;
    }

    const fetchIncoming = async () => {
      try {
        const res = await consultationService.getIncomingRequests();
        if (res.data?.success && Array.isArray(res.data.requests)) {
          setIncomingRequests(res.data.requests);
        }
      } catch (err) {
        // Silently catch background poll errors
      }
    };

    fetchIncoming();
    pollIntervalRef.current = setInterval(fetchIncoming, 3500);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, user?.role]);

  // Current request to display
  const currentRequest = incomingRequests.length > 0 ? incomingRequests[0] : null;

  if (!currentRequest) return null;

  const mode = currentRequest.mode;
  const ratePerMin = (Number(currentRequest.rate_per_min) || 25).toFixed(2);
  const estTotal = ((Number(currentRequest.rate_per_min) || 25) * (Number(currentRequest.duration_minutes) || 15)).toFixed(2);

  const handleRespond = async (action: 'accept' | 'decline') => {
    try {
      setIsResponding(true);
      const res = await consultationService.respondToRequest(currentRequest.id, action);

      // Remove handled request from local state immediately
      setIncomingRequests((prev) => prev.filter((r) => r.id !== currentRequest.id));

      if (action === 'accept' && res.data?.success) {
        const destinationId = res.data.bookingId || currentRequest.id;
        navigate(`/consultation/${mode}/${destinationId}`);
      }
    } catch (err) {
      console.error('Error responding to consultation request:', err);
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-[#D4AF37]/50 bg-[#121212] p-6 shadow-2xl text-[#F5E6C4] shadow-[#D4AF37]/10 ring-1 ring-[#D4AF37]/30">
        {/* Pulsing Ring Header */}
        <div className="flex items-center justify-between border-b border-[#262118] pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981]"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 fill-[#D4AF37]" />
              Incoming Consultation Request
            </span>
          </div>

          <span className="rounded-full border border-[#262118] bg-[#1A1A1A] px-2.5 py-0.5 text-[10px] font-bold text-[#A39E93]">
            {incomingRequests.length} Waiting
          </span>
        </div>

        {/* Client Profile Summary */}
        <div className="mt-4 flex flex-col items-center text-center">
          <div className="relative my-2">
            <span className="absolute -inset-1 rounded-full bg-[#D4AF37]/20 blur-md animate-pulse" />
            <div className="relative h-16 w-16 rounded-full overflow-hidden ring-2 ring-[#D4AF37] bg-[#1A1A1A] flex items-center justify-center">
              {currentRequest.client_avatar ? (
                <img
                  src={currentRequest.client_avatar}
                  alt={currentRequest.client_name || 'Client'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-[#D4AF37]" />
              )}
            </div>
            <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#10B981] ring-2 ring-[#121212]">
              {mode === 'call' ? (
                <Phone className="h-2.5 w-2.5 text-black" />
              ) : (
                <MessageSquare className="h-2.5 w-2.5 text-black" />
              )}
            </span>
          </div>

          <h3 className="text-base font-black text-white">
            {currentRequest.client_name || 'Client User'}
          </h3>
          <p className="text-xs text-[#A39E93]">
            Wants to start an instant {mode === 'call' ? 'Audio/Video Call' : 'Text Chat'} consultation
          </p>
        </div>

        {/* Pricing & Duration Details */}
        <div className="mt-5 rounded-2xl border border-[#262118] bg-[#1A1A1A] p-4 text-xs space-y-2">
          <div className="flex items-center justify-between text-[#A39E93]">
            <span>Channel</span>
            <span className="font-bold text-[#D4AF37] capitalize flex items-center gap-1">
              {mode === 'call' ? <Phone className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
              Instant {mode}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#A39E93]">
            <span>Your Rate</span>
            <span className="font-black text-white">₹{ratePerMin}/min</span>
          </div>
          <div className="flex items-center justify-between text-[#A39E93]">
            <span>Requested Duration</span>
            <span className="font-bold text-[#F5E6C4] flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#D4AF37]" />
              {currentRequest.duration_minutes || 15} Mins
            </span>
          </div>
          <div className="border-t border-[#262118] pt-2 flex items-center justify-between font-bold text-white">
            <span>Expected Revenue</span>
            <span className="text-sm font-black text-[#10B981]">₹{estTotal}</span>
          </div>
        </div>

        {/* Action Buttons: Accept & Decline */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isResponding}
            onClick={() => handleRespond('decline')}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-900/50 bg-rose-950/20 py-3 text-xs font-bold text-rose-300 transition hover:bg-rose-900/40 active:scale-95 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            <span>Decline</span>
          </button>

          <button
            type="button"
            disabled={isResponding}
            onClick={() => handleRespond('accept')}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#D4AF37] py-3 text-xs font-black text-[#080808] shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#AA7C11] active:scale-95 disabled:opacity-50"
          >
            {isResponding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-black" />
                <span>Accept (Start)</span>
              </>
            )}
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] text-[#A39E93]">
          Accepting will start the billable session and open the consultation room immediately.
        </p>
      </div>
    </div>
  );
};
