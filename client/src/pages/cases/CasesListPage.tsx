import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  ShieldAlert,
  Building,
  User,
} from 'lucide-react';
import { caseService } from '../../services/api';
import { LegalCase } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const CasesListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<LegalCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [practiceArea, setPracticeArea] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  // Create Case Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('Criminal Lawyer');
  const [courtName, setCourtName] = useState<string>('');
  const [caseNumber, setCaseNumber] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      const res = await caseService.getAll({
        practiceArea: practiceArea !== 'all' ? practiceArea : undefined,
        status: status !== 'all' ? status : undefined,
        search: search || undefined,
      });
      if (res.data.success) {
        setCases(res.data.cases);
      }
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [practiceArea, status]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setIsSubmitting(true);
      await caseService.create({
        title: title.trim(),
        practiceArea: selectedArea,
        courtName: courtName.trim(),
        caseNumber: caseNumber.trim(),
        summary: summary.trim(),
      });
      setShowCreateModal(false);
      setTitle('');
      setCourtName('');
      setCaseNumber('');
      setSummary('');
      fetchCases();
    } catch (err) {
      console.error('Failed to create case:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Legal Case Management
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Manage court proceedings, FIR defense chronology, hearing dates, and privileged documents.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            <span>Open New Case Matter</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by case title, FIR/case number, or reference code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCases()}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={practiceArea}
              onChange={(e) => setPracticeArea(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="all">All Practice Areas</option>
              <option value="Criminal Lawyer">Criminal Law</option>
              <option value="Corporate and Commercial Lawyer">Corporate & Commercial</option>
              <option value="Contract Lawyer">Contract & CLM</option>
              <option value="Family and Divorce Lawyer">Family & Divorce</option>
              <option value="Property and Real Estate Lawyer">Property & Land</option>
              <option value="Civil Litigation Lawyer">Civil Litigation</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="enquiry">Enquiry</option>
              <option value="active_matter">Active Matter</option>
              <option value="hearing_proceedings">In Proceedings</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Cases Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <Briefcase className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">No Case Files Found</h3>
            <p className="mt-1 text-xs text-slate-500">Initialize a case matter to track hearing dates and filings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="cursor-pointer flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400">
                      {c.case_ref}
                    </span>
                    <Badge variant="purple" className="text-[9px] uppercase">
                      {c.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white line-clamp-2">{c.title}</h3>

                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-400 font-semibold">{c.practice_area}</p>

                  <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                    {c.court_name && (
                      <p className="flex items-center gap-1 line-clamp-1">
                        <Building className="h-3.5 w-3.5 shrink-0" />
                        <span>{c.court_name}</span>
                      </p>
                    )}
                    {c.case_number && (
                      <p className="font-mono text-[10px]">
                        Docket No: <span className="font-bold text-slate-700 dark:text-slate-300">{c.case_number}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center justify-between">
                  {c.next_hearing_date ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                      <Calendar className="h-3.5 w-3.5" />
                      Hearing: {new Date(c.next_hearing_date).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">No hearing scheduled</span>
                  )}

                  <span className="text-xs font-bold text-blue-600 flex items-center gap-0.5">
                    Inspect <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Case Matter Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white">
            <h3 className="text-base font-bold">Open New Legal Case Matter</h3>
            <p className="mt-1 text-xs text-slate-500">Set up a privileged case record for hearings and filings.</p>

            <form onSubmit={handleCreateCase} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Case Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Anticipatory Bail Application u/S 438 CrPC"
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">Practice Area</label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="Criminal Lawyer">Criminal Law</option>
                    <option value="Corporate and Commercial Lawyer">Corporate & Commercial</option>
                    <option value="Contract Lawyer">Contract & CLM</option>
                    <option value="Family and Divorce Lawyer">Family & Divorce</option>
                    <option value="Property and Real Estate Lawyer">Property & Land</option>
                    <option value="Civil Litigation Lawyer">Civil Litigation</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Docket / FIR Number</label>
                  <input
                    type="text"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    placeholder="e.g. FIR-142/2026 or BAIL/881"
                    className="mt-1 w-full rounded-2xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Court / Tribunal / Police Station</label>
                <input
                  type="text"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  placeholder="e.g. High Court of Delhi / Sessions Court Patiala House"
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Case Matter Summary</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Key background facts, prayer sought, and urgent deadlines..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/3 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Case...' : 'Create Case Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
