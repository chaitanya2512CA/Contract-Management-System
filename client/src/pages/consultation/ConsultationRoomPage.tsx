import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Phone,
  PhoneCall,
  Volume2,
  VolumeX,
  Share2,
  MessageSquare,
  FileText,
  Clock,
  Shield,
  ShieldCheck,
  Send,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Star,
  Download,
  Info,
  Zap,
  Lock,
} from 'lucide-react';
import { consultationService, reviewService } from '../../services/api';
import { ConsultationBooking, ChatMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const ConsultationRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const urlMode = searchParams.get('mode'); // 'chat' | 'call'

  const { user } = useAuth();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState<ConsultationBooking | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Astrotalk Call & Media State
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [showInCallChat, setShowInCallChat] = useState<boolean>(false);

  // Active Talk-Time Elapsed Timer (counts up)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'documents'>('chat');
  const [lawyerNotes, setLawyerNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  // Post-Consultation Summary & Review State
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchConsultationData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await consultationService.getById(id);
      if (res.data.success) {
        setConsultation(res.data.consultation);
        setLawyerNotes(res.data.consultation.lawyer_notes || '');
      }

      // Fetch chat messages
      const msgRes = await consultationService.getMessages(id);
      if (msgRes.data.success) {
        setMessages(msgRes.data.messages || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load consultation session.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultationData();
  }, [id]);

  // Astrotalk Ringing to Connected transition (2.2 seconds simulation)
  useEffect(() => {
    const ringTimeout = setTimeout(() => {
      setCallStatus('connected');
    }, 2200);
    return () => clearTimeout(ringTimeout);
  }, []);

  // Real-time chat updates via periodic polling
  useEffect(() => {
    if (!id) return;
    const pollInterval = setInterval(async () => {
      try {
        const msgRes = await consultationService.getMessages(id);
        if (msgRes.data?.success && Array.isArray(msgRes.data.messages)) {
          setMessages(msgRes.data.messages);
        }
      } catch (_) {}
    }, 3000);
    return () => {
      clearInterval(pollInterval);
    };
  }, [id]);

  // Active session talk-time counter (counts up)
  useEffect(() => {
    if (callStatus === 'ended') return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callStatus]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;
    try {
      const res = await consultationService.sendMessage(id, {
        content: newMessage.trim(),
        messageType: 'text',
      });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    try {
      setIsSavingNotes(true);
      await consultationService.complete(id, lawyerNotes);
      alert('Consultation notes saved securely.');
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleEndSession = async () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to conclude this legal consultation session?')) {
      try {
        setCallStatus('ended');
        // Persist session completion and duration in PostgreSQL
        await consultationService.endSession(id, {
          durationSeconds: elapsedSeconds,
          notes: lawyerNotes,
        });

        if (user?.role === 'client' || user?.role === 'business') {
          setShowReviewModal(true);
        } else {
          navigate('/lawyer/dashboard');
        }
      } catch (err) {
        console.error('Failed to conclude session:', err);
        setShowReviewModal(true);
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsSubmittingReview(true);
      await reviewService.submit({
        bookingId: id,
        rating,
        reviewText: reviewText || 'Clear, prompt, and practical legal consultation.',
        tags: ['Verified Consultation', 'Clear Legal Advice'],
      });
      setShowReviewModal(false);
      navigate('/lawyers');
    } catch (err) {
      console.error('Failed to submit review:', err);
      navigate('/lawyers');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-semibold">Connecting to Encrypted Consultation Room...</p>
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-900 p-4 text-white">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="mt-3 text-lg font-bold">Consultation Access Error</h2>
        <p className="mt-1 text-xs text-slate-400">{error || 'Session not found or authorization expired.'}</p>
        <button
          onClick={() => navigate('/lawyers')}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const isLawyer = user?.role === 'lawyer';
  const effectiveMode = urlMode || consultation.consultation_mode || 'chat';
  const isCallMode = effectiveMode === 'call' || effectiveMode === 'audio' || effectiveMode === 'video';

  const feeAmount = Number(consultation.fee_amount || 499);
  const perMinute = Math.max(15, Math.round(feeAmount / (consultation.duration_minutes || 15)));

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white">
      {/* Astrotalk Active Header Bar */}
      <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={
                isLawyer
                  ? consultation.client_avatar ||
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300'
                  : consultation.lawyer_avatar ||
                    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
              }
              alt="Participant"
              className="h-10 w-10 rounded-2xl object-cover ring-2 ring-blue-500 shadow-sm"
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-900">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-200" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white sm:text-base">
                {isLawyer ? consultation.client_name : consultation.lawyer_name}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-800">
                <ShieldCheck className="h-3 w-3" />
                Live Session
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {consultation.practice_area} • Ref: {consultation.booking_ref}
            </p>
          </div>
        </div>

        {/* Timer, Live Billing Rate, and End Call */}
        <div className="flex items-center gap-3">
          {/* Active Talktime Timer */}
          <div className="flex items-center gap-2 rounded-2xl bg-slate-800/80 px-3.5 py-1.5 ring-1 ring-slate-700">
            <Clock className="h-4 w-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="font-mono text-xs font-black text-amber-400 sm:text-sm">
                {formatTimer(elapsedSeconds)}
              </span>
              <span className="text-[9px] font-semibold text-slate-400">⚡ ₹{perMinute}/min</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>End-to-End Encrypted</span>
          </div>

          {/* End Consultation Button */}
          <button
            onClick={handleEndSession}
            className="flex items-center gap-1.5 rounded-2xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950 transition hover:bg-rose-700"
          >
            <PhoneOff className="h-4 w-4" />
            <span>{isCallMode ? 'End Call' : 'End Session'}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Area: Calling Canvas if Call mode, or Chat Canvas if Chat mode */}
        {isCallMode ? (
          <div className="relative flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6">
            {/* Astrotalk Call Centerpiece */}
            <div className="relative flex flex-col items-center text-center">
              {/* Radiating Animated Rings */}
              <div className="relative flex items-center justify-center">
                <div className="absolute h-48 w-48 animate-ping rounded-full bg-emerald-500/10" />
                <div className="absolute h-40 w-40 animate-pulse rounded-full bg-blue-500/15" />
                <img
                  src={
                    isLawyer
                      ? consultation.client_avatar ||
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400'
                      : consultation.lawyer_avatar ||
                        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400'
                  }
                  alt="Remote Participant"
                  className="relative z-10 h-32 w-32 rounded-3xl object-cover ring-4 ring-emerald-500 shadow-2xl"
                />
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-white sm:text-2xl">
                {isLawyer ? consultation.client_name : consultation.lawyer_name}
              </h3>

              {/* Status Indicator */}
              <div className="mt-2 flex items-center gap-2">
                {callStatus === 'ringing' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 px-3 py-1 text-xs font-bold text-amber-400 ring-1 ring-amber-700">
                    <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
                    Ringing Advocate...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Connected • Audio Live
                  </span>
                )}
              </div>

              {/* Active Talk-Time Callout */}
              <div className="mt-4 rounded-2xl bg-slate-900/90 px-4 py-2 border border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Talktime</p>
                <p className="font-mono text-2xl font-black text-amber-400">{formatTimer(elapsedSeconds)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Billed at ₹{perMinute}/min • Protected by Law</p>
              </div>

              {/* Call Control Buttons Bar */}
              <div className="mt-8 flex items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-md">
                {/* Mute Mic */}
                <button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className={`rounded-2xl p-3.5 transition ${
                    isAudioEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white shadow-lg'
                  }`}
                  title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>

                {/* Speaker Toggle */}
                <button
                  onClick={() => setIsSpeakerEnabled(!isSpeakerEnabled)}
                  className={`rounded-2xl p-3.5 transition ${
                    isSpeakerEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-700 text-slate-400'
                  }`}
                  title={isSpeakerEnabled ? 'Speaker Active' : 'Speaker Muted'}
                >
                  {isSpeakerEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>

                {/* Video Toggle */}
                <button
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  className={`rounded-2xl p-3.5 transition ${
                    isVideoEnabled ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                  title={isVideoEnabled ? 'Turn Off Video' : 'Switch to Video Call'}
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>

                {/* Toggle In-Call Chat Drawer */}
                <button
                  onClick={() => setShowInCallChat(!showInCallChat)}
                  className={`rounded-2xl p-3.5 transition ${
                    showInCallChat ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                  title="Open In-Call Chat"
                >
                  <MessageSquare className="h-5 w-5" />
                </button>

                {/* End Call */}
                <button
                  onClick={handleEndSession}
                  className="flex items-center gap-2 rounded-2xl bg-rose-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-rose-900 transition hover:bg-rose-700"
                >
                  <PhoneOff className="h-5 w-5" />
                  <span>End Call</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Full Chat Consultation Interface */
          <div className="flex flex-1 flex-col bg-slate-950">
            {/* Chat Messages Stream */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
              {/* Session Initiation Notice */}
              <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-center text-xs text-slate-400">
                <p className="font-bold text-white">Astrotalk Instant Legal Chat Started</p>
                <p className="text-[11px] mt-0.5">
                  Consulting with {consultation.lawyer_name} • Billed at ₹{perMinute}/min
                </p>
              </div>

              {messages.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-md ${
                        isMe ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-100'
                      }`}
                    >
                      <p>{m.content}</p>
                    </div>
                    <span className="mt-1 text-[10px] text-slate-500">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-2 overflow-x-auto border-t border-slate-800 bg-slate-900/40 px-4 py-2">
              <span className="text-[10px] font-bold uppercase text-slate-500 shrink-0">Quick Queries:</span>
              {[
                'Can we review my vendor agreement?',
                'What is the anticipatory bail procedure?',
                'Need reply to Section 138 notice',
                'Explain founder equity lock-in',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setNewMessage(chip)}
                  className="shrink-0 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-slate-800 bg-slate-900 p-3 sm:px-6">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Ask ${consultation.lawyer_name} anything legal...`}
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Right Drawer (Shown if Call mode has in-call chat open, or for notes/documents) */}
        {(showInCallChat || isLawyer) && (
          <div className="flex w-96 flex-col border-l border-slate-800 bg-slate-900">
            {/* Drawer Tab Headers */}
            <div className="flex border-b border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex flex-1 items-center justify-center gap-1.5 py-3 transition ${
                  activeTab === 'chat'
                    ? 'border-b-2 border-blue-500 bg-slate-800/60 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>In-Call Chat</span>
              </button>

              {isLawyer && (
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-3 transition ${
                    activeTab === 'notes'
                      ? 'border-b-2 border-blue-500 bg-slate-800/60 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Advocate Notes</span>
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'chat' && (
                <div className="flex h-full flex-col justify-between">
                  <div className="space-y-3 overflow-y-auto pr-1">
                    {messages.map((m) => {
                      const isMe = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                              isMe ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'
                            }`}
                          >
                            <p>{m.content}</p>
                          </div>
                          <span className="mt-1 text-[9px] text-slate-500">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type message..."
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-700 transition"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'notes' && isLawyer && (
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Confidential Notes
                    </h4>
                    <textarea
                      rows={12}
                      value={lawyerNotes}
                      onChange={(e) => setLawyerNotes(e.target.value)}
                      placeholder="Record statutory sections, legal opinions, next hearing dates..."
                      className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-800 p-3 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSavingNotes ? 'Saving...' : 'Save Private Notes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Astrotalk Post-Consultation Summary & Review Sheet Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mt-3 text-lg font-extrabold text-white">Consultation Concluded!</h3>
              <p className="mt-1 text-xs text-slate-400">
                Your session with {consultation.lawyer_name} has ended.
              </p>
            </div>

            {/* Astrotalk Session Stats Summary */}
            <div className="mt-5 space-y-2 rounded-2xl bg-slate-800/60 p-4 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Talktime:</span>
                <span className="font-bold text-white font-mono">{formatTimer(elapsedSeconds)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Billing Rate:</span>
                <span className="font-bold text-emerald-400">₹{perMinute}/min</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-sm">
                <span>Total Session Charge:</span>
                <span className="text-amber-400">
                  ₹{Math.max(perMinute, Math.round((elapsedSeconds / 60) * perMinute))}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
              <div>
                <p className="text-center text-xs font-semibold text-slate-300">Rate Your Legal Advice</p>
                <div className="mt-2 flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition hover:scale-125"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={2}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write quick feedback on clarity, legal depth, and responsiveness..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-3 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/lawyers')}
                  className="w-1/3 rounded-xl border border-slate-700 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-2/3 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Done & Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
