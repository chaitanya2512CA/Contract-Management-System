import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  DollarSign,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Sliders,
  Search,
  Activity,
  ArrowUpRight,
  QrCode,
  Copy,
  Check,
  Filter,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { adminService, verificationService, financialService, paymentService } from '../../services/api';
import { PlatformMetrics } from '../../types';
import { Badge } from '../../components/common/Badge';

export const JurisFlowAdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [commissionRate, setCommissionRate] = useState<number>(15);
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'payouts' | 'upi-payments' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // UPI Payments state
  const [upiPayments, setUpiPayments] = useState<any[]>([]);
  const [upiStats, setUpiStats] = useState<any>({
    pending_count: 0,
    verified_count: 0,
    rejected_count: 0,
    total_verified_amount: 0,
  });
  const [upiStatusFilter, setUpiStatusFilter] = useState<string>('all');
  const [upiSearch, setUpiSearch] = useState<string>('');
  const [isUpiLoading, setIsUpiLoading] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const fetchUpiData = async () => {
    try {
      setIsUpiLoading(true);
      const res = await paymentService.getAllUpi({
        status: upiStatusFilter !== 'all' ? upiStatusFilter : undefined,
        search: upiSearch.trim() || undefined,
      });
      if (res.data?.success) {
        setUpiPayments(res.data.payments || []);
        if (res.data.stats) {
          setUpiStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load UPI payments:', err);
    } finally {
      setIsUpiLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [mRes, vRes, pRes, sRes] = await Promise.all([
        adminService.getPlatformMetrics(),
        verificationService.getQueue(),
        financialService.getAdminPayouts(),
        adminService.getCommissionSettings(),
      ]);

      if (mRes.data.success) setMetrics(mRes.data.metrics);
      if (vRes.data.success) setVerificationQueue(vRes.data.queue);
      if (pRes.data.success) setPayouts(pRes.data.payouts);
      if (sRes.data.success && sRes.data.policy) {
        setCommissionRate(sRes.data.policy.default_rate_percent || 15);
      }
      await fetchUpiData();
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'upi-payments') {
      fetchUpiData();
    }
  }, [upiStatusFilter]);

  const handleVerifyUpi = async (id: string, status: 'verified' | 'rejected') => {
    const defaultNote = status === 'verified' ? 'Verified by Institutional Administrator' : 'Rejected - invalid UTR reference';
    const notes = prompt(`Enter admin notes for ${status}:`, defaultNote) || defaultNote;
    try {
      setActionLoadingId(id);
      const res = await paymentService.verifyUpi(id, { status, notes });
      if (res.data?.success) {
        alert(`UPI Payment marked as ${status}. ${status === 'verified' ? 'Automated confirmation email dispatched to client.' : ''}`);
        fetchUpiData();
      }
    } catch (err: any) {
      console.error('UPI Verification error:', err);
      alert(err.response?.data?.message || 'Failed to update payment status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleReviewVerification = async (id: string, status: 'approved' | 'rejected') => {
    const adminNotes = prompt(`Enter notes for ${status}:`) || 'Standard institutional review';
    try {
      await verificationService.review(id, { status, adminNotes });
      alert(`Advocate verification marked as ${status}.`);
      fetchAdminData();
    } catch (err) {
      console.error('Verification review failed:', err);
    }
  };

  const handleProcessPayout = async (id: string) => {
    const bankRef = prompt('Enter bank transaction / UTR reference number:');
    if (!bankRef) return;
    try {
      await financialService.processPayout(id, { status: 'completed', bankReference: bankRef });
      alert('Payout marked as completed.');
      fetchAdminData();
    } catch (err) {
      console.error('Payout process failed:', err);
    }
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await adminService.updateCommissionSettings({ defaultRatePercent: commissionRate });
      alert('Platform commission policy updated.');
    } catch (err) {
      console.error('Failed to update commission:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Platform Governance & Control Center
              </h1>
              <Badge variant="danger" className="text-[10px]">
                Super Administrator
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              JurisFlow Institutional Governance • Bar Council verification, commission policies, and payouts
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center rounded-2xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm dark:border-slate-800 dark:bg-slate-900 gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`rounded-xl px-3.5 py-1.5 transition ${
                activeTab === 'overview' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              KPI Overview
            </button>
            <button
              onClick={() => setActiveTab('upi-payments')}
              className={`rounded-xl px-3.5 py-1.5 transition flex items-center gap-1.5 ${
                activeTab === 'upi-payments'
                  ? 'bg-[#D4AF37] text-[#080808] font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>UPI Payments ({upiStats.pending_count || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`rounded-xl px-3.5 py-1.5 transition ${
                activeTab === 'verifications' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Advocate Queue ({verificationQueue.filter((v) => v.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`rounded-xl px-3.5 py-1.5 transition ${
                activeTab === 'payouts' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Payout Settlements
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`rounded-xl px-3.5 py-1.5 transition ${
                activeTab === 'settings' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Policy Settings
            </button>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500">Gross Payment Volume (GMV)</span>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  ₹{Number(metrics?.grossVolumeINR || 0).toLocaleString()}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">Total customer transactions</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500">Platform Commission Earned</span>
                <p className="mt-2 text-2xl font-black text-emerald-600">
                  ₹{Number(metrics?.platformCommissionsINR || 0).toLocaleString()}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">15% net platform retention</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500">Advocates Directory</span>
                <p className="mt-2 text-2xl font-black text-blue-700 dark:text-blue-400">
                  {metrics?.verifiedLawyers} / {metrics?.totalLawyers} Verified
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {metrics?.pendingVerifications} verification applications pending
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500">Total Consultations & CLM</span>
                <p className="mt-2 text-2xl font-black text-purple-600">
                  {metrics?.totalConsultations} Consults • {metrics?.totalContracts} Contracts
                </p>
                <p className="mt-1 text-[10px] text-slate-400">{metrics?.totalCases} active legal matters</p>
              </div>
            </div>

            {/* Quick Actions & Governance Checklist */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Institutional Governance</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div
                  onClick={() => setActiveTab('upi-payments')}
                  className="cursor-pointer rounded-2xl border border-amber-300/60 bg-amber-50/40 p-4 hover:border-[#D4AF37] dark:border-amber-900/40 dark:bg-amber-950/20 transition"
                >
                  <QrCode className="h-6 w-6 text-[#D4AF37]" />
                  <h4 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                    Direct UPI Settlements
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Verify client 12-digit UTRs and trigger payment confirmation receipts.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('verifications')}
                  className="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-blue-400 dark:border-slate-800 dark:bg-slate-800/50 transition"
                >
                  <ShieldCheck className="h-6 w-6 text-blue-600" />
                  <h4 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                    Review Advocate Verifications
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Verify Bar Council enrollment certificates before verified badge display.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('payouts')}
                  className="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-blue-400 dark:border-slate-800 dark:bg-slate-800/50 transition"
                >
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                  <h4 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                    Review Payout Dispatches
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Settle verified earnings to advocate registered bank accounts.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('settings')}
                  className="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-blue-400 dark:border-slate-800 dark:bg-slate-800/50 transition"
                >
                  <Sliders className="h-6 w-6 text-purple-600" />
                  <h4 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                    Configure Commission Policy
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Adjust platform transaction retention rates and dispute policies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Direct UPI Payments Queue */}
        {activeTab === 'upi-payments' && (
          <div className="space-y-6">
            {/* Top KPI Metrics for UPI */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500">Verified UPI Volume</span>
                <p className="mt-2 text-2xl font-black text-emerald-600">
                  ₹{Number(upiStats.total_verified_amount || 0).toLocaleString('en-IN')}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">Total credited via direct UPI</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500">Pending UTR Queue</span>
                <p className="mt-2 text-2xl font-black text-amber-500">
                  {upiStats.pending_count || 0}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">Awaiting bank reconciliation</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500">Verified Payments</span>
                <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
                  {upiStats.verified_count || 0}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">Confirmation receipts sent</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500">Rejected Claims</span>
                <p className="mt-2 text-2xl font-black text-rose-600">
                  {upiStats.rejected_count || 0}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">Invalid UTR submissions</p>
              </div>
            </div>

            {/* UPI Management Panel */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Direct UPI Payments Queue
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Merchant ID: 7558343192-1@nyes
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Verify client 12-digit UTRs against your bank/merchant statement. Approving triggers automated confirmation emails and settles advocate bookings.
                  </p>
                </div>

                <button
                  onClick={fetchUpiData}
                  disabled={isUpiLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isUpiLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Queue</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by 12-digit UTR, client name, or email..."
                    value={upiSearch}
                    onChange={(e) => setUpiSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUpiData()}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {['all', 'pending', 'verified', 'rejected'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setUpiStatusFilter(st)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition ${
                        upiStatusFilter === st
                          ? 'bg-blue-700 text-white shadow-sm'
                          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {st === 'all' ? 'All Payments' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payments Table */}
              <div className="mt-5 overflow-x-auto">
                {isUpiLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">Loading UPI payments...</div>
                ) : upiPayments.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No UPI payments found matching the current filter.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-3">Date & Time</th>
                        <th className="py-3 px-3">Client</th>
                        <th className="py-3 px-3">Advocate / Purpose</th>
                        <th className="py-3 px-3 text-right">Amount (INR)</th>
                        <th className="py-3 px-3">12-Digit UTR</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {upiPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(p.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {p.user_name || 'Client'}
                            </div>
                            <div className="text-[11px] text-slate-500">{p.user_email}</div>
                            {p.user_phone && <div className="text-[10px] text-slate-400">{p.user_phone}</div>}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {p.advocate_name || 'JurisFlow Platform'}
                            </div>
                            {p.notes && <div className="text-[10px] italic text-slate-400 mt-0.5">"{p.notes}"</div>}
                          </td>
                          <td className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                            ₹{Number(p.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900">
                                {p.utr_number}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyUtr(p.utr_number)}
                                title="Copy UTR"
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                              >
                                {copiedUtr === p.utr_number ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            {p.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300">
                                <Clock className="h-3 w-3" />
                                Pending
                              </span>
                            )}
                            {p.status === 'verified' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                Verified
                              </span>
                            )}
                            {p.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300">
                                <XCircle className="h-3 w-3" />
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            {p.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={actionLoadingId === p.id}
                                  onClick={() => handleVerifyUpi(p.id, 'verified')}
                                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>{actionLoadingId === p.id ? 'Verifying...' : 'Verify & Confirm'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoadingId === p.id}
                                  onClick={() => handleVerifyUpi(p.id, 'rejected')}
                                  className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-950/40 transition disabled:opacity-50"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                {p.verified_at ? new Date(p.verified_at).toLocaleDateString('en-IN') : 'Completed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Advocate Verification Queue */}
        {activeTab === 'verifications' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Advocate Verification Applications</h3>
            <p className="text-xs text-slate-500">
              Scrutinize Bar Council enrollment numbers against state bar registers.
            </p>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {verificationQueue.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">No applications in verification queue.</p>
              ) : (
                verificationQueue.map((v) => (
                  <div key={v.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{v.full_name}</span>
                        <Badge
                          variant={v.status === 'approved' ? 'success' : v.status === 'pending' ? 'warning' : 'danger'}
                          className="text-[10px]"
                        >
                          {v.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold">{v.primary_specialty}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Bar No: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{v.bar_registration_number}</span> • {v.bar_council_state} • Enrolled {v.enrollment_year}
                      </p>
                    </div>

                    {v.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReviewVerification(v.id, 'approved')}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approve & Verify</span>
                        </button>
                        <button
                          onClick={() => handleReviewVerification(v.id, 'rejected')}
                          className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Payout Settlements */}
        {activeTab === 'payouts' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Lawyer Payout Settlements</h3>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {payouts.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">No payout requests registered.</p>
              ) : (
                payouts.map((p) => (
                  <div key={p.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700">{p.payout_ref}</span>
                        <Badge variant={p.status === 'completed' ? 'success' : 'warning'} className="text-[10px]">
                          {p.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        Adv. {p.lawyer_name} • Requested: ₹{Number(p.requested_amount).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Bank: ••••{p.bank_account_number?.slice(-4)} • IFSC: {p.bank_ifsc} • Holder: {p.bank_holder_name}
                      </p>
                    </div>

                    {p.status === 'requested' && (
                      <button
                        onClick={() => handleProcessPayout(p.id)}
                        className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
                      >
                        Dispatch Settlement
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Policy Settings */}
        {activeTab === 'settings' && (
          <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Platform Commission Policy</h3>
            <p className="text-xs text-slate-500">
              Configure the platform service fee percentage automatically deducted on consultation completions.
            </p>

            <form onSubmit={handleUpdateCommission} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-500">Platform Commission Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="rounded-2xl bg-blue-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Update Commission Policy'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
