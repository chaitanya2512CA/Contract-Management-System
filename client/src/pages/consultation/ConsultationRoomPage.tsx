import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Share2,
  MessageSquare,
  FileText,
  Clock,
  Shield,
  Send,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Star,
  Download,
  Info,
} from 'lucide-react';
import { consultationService, reviewService } from '../../services/api';
import { ConsultationBooking, ChatMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const ConsultationRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState<ConsultationBooking | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Video / Audio Call State Controls
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30 * 60);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'documents'>('chat');
  const [lawyerNotes, setLawyerNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  // Review Modal State
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
        if (res.data.consultation.duration_minutes) {
          setSecondsRemaining(res.data.consultation.duration_minutes * 60);
        }
      }

      // Fetch chat messages
      const msgRes = await consultationService.getMessages(id);
      if (msgRes.data.success) {
        setMessages(msgRes.data.messages);
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

  // Session duration countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;
    try {
      const res = await consultationService.sendMessage(id, { content: newMessage.trim(), messageType: 'text' });
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

  const handleEndCall = async () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to conclude this legal consultation session?')) {
      try {
        await consultationService.complete(id, lawyerNotes);
        if (user?.role === 'client' || user?.role === 'business') {
          setShowReviewModal(true);
        } else {
          navigate('/lawyer/dashboard');
        }
      } catch (err) {
        console.error('Failed to conclude session:', err);
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
        reviewText,
        tags: ['Verified Consultation', 'Clear Legal Advice'],
      });
      setShowReviewModal(false);
      navigate('/client/dashboard');
    } catch (err) {
      console.error('Failed to submit review:', err);
      navigate('/client/dashboard');
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
          <p className="text-sm font-semibold">Initializing Encrypted Consultation Room...</p>
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
          onClick={() => navigate('/')}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const isLawyer = user?.role === 'lawyer';

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white">
      {/* Top Header Bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold sm:text-sm">
                Session {consultation.booking_ref} • {consultation.practice_area}
              </h2>
              <Badge variant="success" className="text-[9px] py-0 px-1.5">
                Privileged Call
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400">
              {isLawyer ? `Client: ${consultation.client_name}` : `Advocate: ${consultation.lawyer_name}`}
            </p>
          </div>
        </div>

        {/* Timer & Health Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-mono font-bold text-amber-400 ring-1 ring-slate-700">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>HD Encrypted</span>
          </div>

          <button
            onClick={handleEndCall}
            className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </header>

      {/* Main Body: Stage (Left 65%) + Drawer (Right 35%) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Video / Audio Consultation Stage */}
        <div className="relative flex flex-1 flex-col items-center justify-center bg-slate-950 p-4">
          {/* Simulated Video Canvas */}
          <div className="relative flex h-full w-full max-w-4xl items-center justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            {isVideoEnabled ? (
              <div className="relative h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                <img
                  src={
                    isLawyer
                      ? consultation.client_avatar ||
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600'
                      : consultation.lawyer_avatar ||
                        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600'
                  }
                  alt="Remote Participant"
                  className="h-full w-full object-cover opacity-80"
                />
                <div className="absolute bottom-4 left-4 rounded-xl bg-slate-900/80 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                  {isLawyer ? consultation.client_name : consultation.lawyer_name} (Speaking)
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 ring-4 ring-blue-600/50">
                  <VideoOff className="h-10 w-10" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Camera Feed Paused</p>
              </div>
            )}

            {/* Local Video Thumbnail (Picture-in-Picture) */}
            <div className="absolute right-4 top-4 h-28 w-40 overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-800 shadow-lg sm:h-36 sm:w-48">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
                }
                alt="Self View"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-1.5 left-2 rounded bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-bold">
                You
              </div>
            </div>

            {/* Stage Bottom Floating Controls */}
            <div className="absolute bottom-6 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/90 px-5 py-3 shadow-2xl backdrop-blur-md">
              <button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`rounded-xl p-3 transition ${
                  isAudioEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                }`}
                title={isAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              <button
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className={`rounded-xl p-3 transition ${
                  isVideoEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                }`}
                title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
              >
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>

              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`rounded-xl p-3 transition ${
                  isScreenSharing ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
                title="Share Screen"
              >
                <Share2 className="h-5 w-5" />
              </button>

              <button
                onClick={handleEndCall}
                className="rounded-xl bg-rose-600 px-5 py-3 text-xs font-bold text-white shadow-lg hover:bg-rose-700 transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>

        {/* Right: Drawer (Chat, Confidential Notes, Shared Docs) */}
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
              <span>Chat</span>
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

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex flex-1 items-center justify-center gap-1.5 py-3 transition ${
                activeTab === 'documents'
                  ? 'border-b-2 border-blue-500 bg-slate-800/60 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Paperclip className="h-4 w-4" />
              <span>Documents</span>
            </button>
          </div>

          {/* Drawer Tab Content */}
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

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type legal message or question..."
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
                    Confidential Advocate Notes
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    These notes are strictly private and never disclosed to the client.
                  </p>
                  <textarea
                    rows={12}
                    value={lawyerNotes}
                    onChange={(e) => setLawyerNotes(e.target.value)}
                    placeholder="Record case impressions, applicable statutory sections, strategy..."
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

            {activeTab === 'documents' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Case Documents</h4>
                <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-3 text-xs">
                  <p className="font-semibold text-white">Client Issue Description:</p>
                  <p className="mt-1 text-slate-400">{consultation.legal_issue_description}</p>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-center">
                  <Paperclip className="mx-auto h-6 w-6 text-slate-500" />
                  <p className="mt-2 text-xs font-semibold text-slate-300">Upload Supporting Proof</p>
                  <p className="text-[10px] text-slate-500">PDF, DOCX, or JPG up to 15MB</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Consultation Client Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                <Star className="h-6 w-6 fill-amber-400" />
              </div>
              <h3 className="mt-3 text-lg font-bold">Rate Your Legal Consultation</h3>
              <p className="mt-1 text-xs text-slate-400">
                How was your session with {consultation.lawyer_name}?
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-6 space-y-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition hover:scale-125"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience (promptness, legal clarity, practical advice)..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-3 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/client/dashboard')}
                  className="w-1/3 rounded-xl border border-slate-700 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-2/3 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
