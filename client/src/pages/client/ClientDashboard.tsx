import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Briefcase,
  CreditCard,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
} from 'lucide-react';
import { consultationService, contractService, caseService } from '../../services/api';
import { ConsultationBooking, Contract, LegalCase } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState<ConsultationBooking[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [cRes, kRes, csRes] = await Promise.all([
          consultationService.getAll(),
          contractService.getAll(),
          caseService.getAll(),
        ]);

        if (cRes.data.success) setConsultations(cRes.data.consultations);
        if (kRes.data.success) setContracts(kRes.data.contracts);
        if (csRes.data.success) setCases(csRes.data.cases);
      } catch (err) {
        console.error('Failed to load client dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const upcomingConsultations = consultations.filter(
    (c) => c.status === 'confirmed' || c.status === 'in_progress' || c.status === 'accepted'
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Welcome back, {user?.name || 'Client'}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              ContractIQ Legal Hub • Track consultations, AI contract reviews, and active case proceedings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/lawyers"
              className="flex items-center gap-1.5 rounded-2xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-none"
            >
              <Plus className="h-4 w-4" />
              <span>Consult an Advocate</span>
            </Link>

            <Link
              to="/contracts"
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Upload Contract for AI</span>
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Active Bookings</span>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              {upcomingConsultations.length}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">Scheduled advocate calls</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">AI Contracts</span>
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{contracts.length}</p>
            <p className="mt-1 text-[10px] text-slate-400">Analyzed & repository</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Legal Cases</span>
              <Briefcase className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{cases.length}</p>
            <p className="mt-1 text-[10px] text-slate-400">Court & advisory files</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Completed Sessions</span>
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              {consultations.filter((c) => c.status === 'completed').length}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">With verified summaries</p>
          </div>
        </div>

        {/* Section 1: Upcoming Consultations */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Legal Consultations</h2>
              <p className="text-xs text-slate-500">Access scheduled video calls and direct lawyer chat</p>
            </div>
            <Link to="/lawyers" className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">
              Book Another +
            </Link>
          </div>

          {upcomingConsultations.length === 0 ? (
            <div className="py-10 text-center">
              <Calendar className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                No active consultations scheduled
              </p>
              <Link
                to="/lawyers"
                className="mt-3 inline-block rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
              >
                Find an Advocate Now
              </Link>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingConsultations.map((c) => (
                <div key={c.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={
                        c.lawyer_avatar ||
                        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
                      }
                      alt={c.lawyer_name}
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                          {c.lawyer_name}
                        </h4>
                        <Badge
                          variant={c.status === 'confirmed' ? 'success' : 'info'}
                          className="text-[10px] py-0 px-1.5"
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">{c.practice_area}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(c.scheduled_start).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}{' '}
                        • {c.duration_minutes} Mins • Mode: {c.consultation_mode.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/consultations/${c.id}/room`)}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Join Call Room</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Split Grid (My Contracts & Legal Cases) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Contracts CLM Widget */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI-Analyzed Contracts</h3>
                <p className="text-[11px] text-slate-500">Risk assessments and lawyer review status</p>
              </div>
              <Link to="/contracts" className="text-xs font-bold text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {contracts.slice(0, 3).map((k) => (
                <div
                  key={k.id}
                  onClick={() => navigate(`/contracts/${k.id}`)}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-3 hover:border-blue-300 dark:border-slate-800 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{k.title}</p>
                      <p className="text-[10px] text-slate-500">{k.contract_ref} • {k.contract_type.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {k.ai_risk_score !== undefined && (
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                          k.ai_risk_score > 60
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                            : k.ai_risk_score > 30
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}
                      >
                        Risk {k.ai_risk_score}/100
                      </span>
                    )}
                    <Badge variant="default" className="text-[10px]">
                      {k.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Legal Cases Widget */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Case Proceedings</h3>
                <p className="text-[11px] text-slate-500">Court dates, bail filings & dispute files</p>
              </div>
              <Link to="/cases" className="text-xs font-bold text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {cases.slice(0, 3).map((cs) => (
                <div
                  key={cs.id}
                  onClick={() => navigate(`/cases/${cs.id}`)}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-3 hover:border-blue-300 dark:border-slate-800 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
                      <Briefcase className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{cs.title}</p>
                      <p className="text-[10px] text-slate-500">{cs.case_ref} • {cs.practice_area}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant="purple" className="text-[10px]">
                      {cs.status.replace('_', ' ')}
                    </Badge>
                    {cs.next_hearing_date && (
                      <p className="text-[10px] text-rose-600 font-semibold mt-1">
                        Hearing: {new Date(cs.next_hearing_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
