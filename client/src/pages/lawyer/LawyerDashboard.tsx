import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Briefcase,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Users,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Scale,
  Building,
  Home,
  Heart,
  Cpu,
  Plus,
  ArrowDownRight,
  Download,
} from 'lucide-react';
import { consultationService, financialService, verificationService, caseService } from '../../services/api';
import { ConsultationBooking, LawyerEarningsSummary, LegalCase, LawyerSpecialty } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const LawyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState<ConsultationBooking[]>([]);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [earnings, setEarnings] = useState<LawyerEarningsSummary | null>(null);
  const [ledgerItems, setLedgerItems] = useState<any[]>([]);
  const [activeSpecialtyView, setActiveSpecialtyView] = useState<string>('Criminal Lawyer');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [payoutModalOpen, setPayoutModalOpen] = useState<boolean>(false);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutLoading, setPayoutLoading] = useState<boolean>(false);

  const lawyerProfile = user?.lawyerProfile;

  const fetchLawyerData = async () => {
    try {
      setIsLoading(true);
      const [cRes, csRes, eRes] = await Promise.all([
        consultationService.getAll(),
        caseService.getAll(),
        financialService.getEarnings(),
      ]);

      if (cRes.data.success) setConsultations(cRes.data.consultations);
      if (csRes.data.success) setCases(csRes.data.cases);
      if (eRes.data.success) {
        setEarnings(eRes.data.summary);
        setLedgerItems(eRes.data.ledger);
      }

      if (lawyerProfile?.primary_specialty) {
        setActiveSpecialtyView(lawyerProfile.primary_specialty);
      }
    } catch (err) {
      console.error('Failed to load advocate dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyerData();
  }, []);

  const handleAcceptBooking = async (id: string) => {
    try {
      await consultationService.accept(id);
      fetchLawyerData();
    } catch (err) {
      console.error('Failed to accept booking:', err);
    }
  };

  const handleRejectBooking = async (id: string) => {
    const reason = prompt('Please enter reason for declining this consultation:');
    if (reason) {
      try {
        await consultationService.reject(id, reason);
        fetchLawyerData();
      } catch (err) {
        console.error('Failed to reject booking:', err);
      }
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) return;
    try {
      setPayoutLoading(true);
      await financialService.requestPayout(parseFloat(payoutAmount));
      setPayoutModalOpen(false);
      setPayoutAmount('');
      alert('Payout request submitted successfully. Transfer will complete in 1-2 banking days.');
      fetchLawyerData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payout request failed.');
    } finally {
      setPayoutLoading(false);
    }
  };

  const pendingRequests = consultations.filter((c) => c.status === 'pending');
  const todaySessions = consultations.filter(
    (c) => c.status === 'confirmed' || c.status === 'accepted' || c.status === 'in_progress'
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header & Bar Council Status */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
              }
              alt={user?.name}
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-blue-600 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                  {user?.name || 'Advocate'}
                </h1>
                {lawyerProfile?.is_verified ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Bar Verified
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    Verification Pending
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                {lawyerProfile?.primary_specialty || 'Senior Advocate'} • Bar No:{' '}
                {lawyerProfile?.bar_council_number || 'D/1842/2012'}
              </p>
            </div>
          </div>

          {/* Specialty View Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Practice View:</span>
            <select
              value={activeSpecialtyView}
              onChange={(e) => setActiveSpecialtyView(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="Criminal Lawyer">Criminal Law Mode</option>
              <option value="Corporate and Commercial Lawyer">Corporate & Commercial Mode</option>
              <option value="Contract Lawyer">Contract & CLM Mode</option>
              <option value="Family and Divorce Lawyer">Family & Divorce Mode</option>
              <option value="Property and Real Estate Lawyer">Property & Land Mode</option>
              <option value="Cybercrime and Technology Lawyer">Cybercrime & Tech Mode</option>
              <option value="Tax and GST Lawyer">Tax & GST Mode</option>
              <option value="Intellectual Property Lawyer">IP & Patents Mode</option>
            </select>
          </div>
        </div>

        {/* Financial Earnings Overview */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500">Gross Consultation Earnings</span>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              ₹{Number(earnings?.total_gross || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">Total client receipts</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500">Platform Commission (15%)</span>
            <p className="mt-2 text-2xl font-black text-rose-600">
              -₹{Number(earnings?.total_commission || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">Statutory & technology fee</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Available Payout Balance</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-600">
              ₹{Number(earnings?.available_balance || 0).toLocaleString()}
            </p>
            <button
              onClick={() => setPayoutModalOpen(true)}
              className="mt-2 flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              <span>Withdraw Payout</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500">Pending Requests</span>
            <p className="mt-2 text-2xl font-black text-amber-500">{pendingRequests.length}</p>
            <p className="mt-1 text-[10px] text-slate-400">Require client acceptance</p>
          </div>
        </div>

        {/* Dynamic Specialty Adaptation Widget Banner */}
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-blue-500/30 px-2 py-0.5 text-xs font-bold text-blue-300">
                  SPECIALTY WORKSPACE
                </span>
                <span className="text-xs text-slate-300">• {activeSpecialtyView}</span>
              </div>
              <h2 className="mt-2 text-lg font-bold sm:text-xl">
                {activeSpecialtyView === 'Criminal Lawyer' && 'Criminal Defense & Bail Proceedings Workflow'}
                {activeSpecialtyView === 'Corporate and Commercial Lawyer' &&
                  'Corporate M&A & Commercial Contracts Workflow'}
                {activeSpecialtyView === 'Contract Lawyer' && 'CLM Contract Redlining & Risk Matrix Workflow'}
                {activeSpecialtyView === 'Family and Divorce Lawyer' &&
                  'Confidential Matrimonial & Child Custody Vault'}
                {activeSpecialtyView === 'Property and Real Estate Lawyer' &&
                  '30-Year Title Due Diligence & RERA Workflow'}
                {activeSpecialtyView === 'Cybercrime and Technology Lawyer' &&
                  'IT Act 66A/66D & DPDP Compliance Workflow'}
                {activeSpecialtyView === 'Tax and GST Lawyer' && 'ITAT & GST Dispute Appellate Workflow'}
                {activeSpecialtyView === 'Intellectual Property Lawyer' &&
                  'Trademark Registry & Patent Litigation Workflow'}
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                Custom document checklists, statutory deadlines, and tailored stages adapted to your practice area.
              </p>
            </div>

            <Link
              to="/cases"
              className="flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md hover:bg-slate-100"
            >
              <Plus className="h-4 w-4 text-blue-700" />
              <span>New {activeSpecialtyView.replace('Lawyer', 'Matter')}</span>
            </Link>
          </div>

          {/* Specialty Specific Metrics Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {activeSpecialtyView === 'Criminal Lawyer' && (
              <>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-300">Bail Applications (u/S 438/439)</span>
                  <p className="text-lg font-extrabold">3 Active</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-300">Upcoming Court Dates</span>
                  <p className="text-lg font-extrabold text-amber-300">2 This Week</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-300">Chargesheets Received</span>
                  <p className="text-lg font-extrabold">4 Under Review</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-300">FIR Quashing (S. 482)</span>
                  <p className="text-lg font-extrabold text-emerald-300">1 Draft Pending</p>
                </div>
              </>
            )}

            {activeSpecialtyView === 'Corporate and Commercial Lawyer' && (
              <>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-300">Commercial Contracts</span>
                  <p className="text-lg font-extrabold">8 Active</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-300">NDA Reviews</span>
                  <p className="text-lg font-extrabold text-amber-300">3 In Queue</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-300">Founder Vesting Deeds</span>
                  <p className="text-lg font-extrabold">2 Approved</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-300">M&A Due Diligence</span>
                  <p className="text-lg font-extrabold text-emerald-300">USD 1.2M Deal</p>
                </div>
              </>
            )}

            {activeSpecialtyView === 'Contract Lawyer' && (
              <>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-300">Shared Contracts for Review</span>
                  <p className="text-lg font-extrabold text-amber-300">2 In Review</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-300">AI Risk Red Flags Capped</span>
                  <p className="text-lg font-extrabold">14 Resolved</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-300">Avg Turnaround Time</span>
                  <p className="text-lg font-extrabold text-emerald-300">18.4 Hours</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[10px] text-slate-300">Negotiation Redlines</span>
                  <p className="text-lg font-extrabold">5 Pending Client</p>
                </div>
              </>
            )}

            {activeSpecialtyView !== 'Criminal Lawyer' &&
              activeSpecialtyView !== 'Corporate and Commercial Lawyer' &&
              activeSpecialtyView !== 'Contract Lawyer' && (
                <>
                  <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                    <span className="text-[10px] text-slate-300">Active Case Inquiries</span>
                    <p className="text-lg font-extrabold">5 Matters</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                    <span className="text-[10px] text-slate-300">Client Consultations</span>
                    <p className="text-lg font-extrabold text-amber-300">12 Completed</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                    <span className="text-[10px] text-slate-300">Document Submissions</span>
                    <p className="text-lg font-extrabold">7 Processed</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                    <span className="text-[10px] text-slate-300">Statutory Compliance</span>
                    <p className="text-lg font-extrabold text-emerald-300">100% Up to date</p>
                  </div>
                </>
              )}
          </div>
        </div>

        {/* Pending Consultation Requests (1-Click Accept / Reject) */}
        {pendingRequests.length > 0 && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Clock className="h-5 w-5" />
              <h3 className="text-sm font-bold">Pending Consultation Requests ({pendingRequests.length})</h3>
            </div>
            <div className="mt-4 space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{req.client_name}</span>
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                        {req.consultation_mode.toUpperCase()} ({req.duration_minutes} min)
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{req.legal_issue_description}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Requested Time: {new Date(req.scheduled_start).toLocaleString()} • Fee: ₹{req.fee_amount}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptBooking(req.id)}
                      className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleRejectBooking(req.id)}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Appointments & Sessions */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Appointments & Calls</h3>
              <p className="text-xs text-slate-500">Confirmed consultation bookings ready for session room</p>
            </div>
          </div>

          {todaySessions.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">No confirmed appointments scheduled right now.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {todaySessions.map((s) => (
                <div key={s.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {s.client_name} • {s.practice_area}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(s.scheduled_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} •{' '}
                      {s.duration_minutes} min • {s.consultation_mode.toUpperCase()}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/consultations/${s.id}/room`)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 transition"
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Launch Session Room</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payout Withdrawal Modal */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white">
            <h3 className="text-base font-bold">Request Bank Settlement Payout</h3>
            <p className="mt-1 text-xs text-slate-500">
              Available Balance: ₹{Number(earnings?.available_balance || 0).toLocaleString()}
            </p>

            <form onSubmit={handleRequestPayout} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Payout Amount (INR)</label>
                <input
                  type="number"
                  min="100"
                  max={Number(earnings?.available_balance || 0)}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  required
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Bank Destination:</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Account: ••••{lawyerProfile?.bank_account_number?.slice(-4) || '1234'} • IFSC:{' '}
                  {lawyerProfile?.bank_ifsc || 'HDFC0001234'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="w-1/3 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="w-2/3 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {payoutLoading ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
