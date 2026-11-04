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
} from 'lucide-react';
import { adminService, verificationService, financialService } from '../../services/api';
import { PlatformMetrics } from '../../types';
import { Badge } from '../../components/common/Badge';

export const ContractIQAdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [commissionRate, setCommissionRate] = useState<number>(15);
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'payouts' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

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
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

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
              ContractIQ Institutional Governance • Bar Council verification, commission policies, and payouts
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setActiveTab('overview')}
              className={`rounded-xl px-3.5 py-1.5 transition ${
                activeTab === 'overview' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              KPI Overview
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`rounded-xl px-3.5 py-1.5 transition ${
                activeTab === 'verifications' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Advocate Queue ({verificationQueue.filter((v) => v.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`rounded-xl px-3.5 py-1.5 transition ${
                activeTab === 'payouts' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payout Settlements
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`rounded-xl px-3.5 py-1.5 transition ${
                activeTab === 'settings' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
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
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div
                  onClick={() => setActiveTab('verifications')}
                  className="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-blue-400 dark:border-slate-800 dark:bg-slate-800/50"
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
                  className="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-blue-400 dark:border-slate-800 dark:bg-slate-800/50"
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
                  className="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-blue-400 dark:border-slate-800 dark:bg-slate-800/50"
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
