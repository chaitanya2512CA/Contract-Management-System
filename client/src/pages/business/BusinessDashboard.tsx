import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Sparkles,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Share2,
  Users,
  ChevronRight,
} from 'lucide-react';
import { contractService } from '../../services/api';
import { Contract } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const BusinessDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Contract Modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newType, setNewType] = useState<string>('service');
  const [newContent, setNewContent] = useState<string>('');
  const [newVal, setNewVal] = useState<string>('500000');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      const res = await contractService.getAll({
        type: filterType !== 'all' ? filterType : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchQuery || undefined,
      });
      if (res.data.success) {
        setContracts(res.data.contracts);
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [filterType, filterStatus]);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      setIsCreating(true);
      const res = await contractService.create({
        title: newTitle.trim(),
        contractType: newType,
        contentText: newContent.trim(),
        contractValue: parseFloat(newVal) || 0,
      });
      setCreateModalOpen(false);
      setNewTitle('');
      setNewContent('');
      fetchContracts();
      if (res.data.contract) {
        navigate(`/contracts/${res.data.contract.id}`);
      }
    } catch (err) {
      console.error('Failed to create contract:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const highRiskCount = contracts.filter((c) => (c.ai_risk_score || 0) > 50).length;
  const inReviewCount = contracts.filter((c) => c.status === 'in_review').length;
  const activeCount = contracts.filter((c) => c.status === 'active' || c.status === 'signed').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Enterprise Contract Lifecycle Management (CLM)
              </h1>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                AI Powered
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {user?.companyName || 'Apex Dynamics Technologies Pvt. Ltd.'} • Central Contract Repository & Red-Flag
              Intelligence
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Create / Upload Contract</span>
            </button>

            <Link
              to="/lawyers"
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Users className="h-4 w-4 text-blue-600" />
              <span>Engage Corporate Counsel</span>
            </Link>
          </div>
        </div>

        {/* CLM KPI Metrics */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500">Total Active Contracts</span>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{contracts.length}</p>
            <p className="mt-1 text-[10px] text-slate-400">{activeCount} fully executed</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500">High AI Risk Flags</span>
            <p className="mt-2 text-2xl font-black text-rose-600">{highRiskCount}</p>
            <p className="mt-1 text-[10px] text-slate-400">Uncapped liability / Restrictive terms</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500">Advocate Review Queue</span>
            <p className="mt-2 text-2xl font-black text-amber-500">{inReviewCount}</p>
            <p className="mt-1 text-[10px] text-slate-400">Shared with marketplace advocates</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500">Average Risk Score</span>
            <p className="mt-2 text-2xl font-black text-emerald-600">38/100</p>
            <p className="mt-1 text-[10px] text-slate-400">Standard low-to-moderate index</p>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contracts by title, ref code, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchContracts()}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="all">All Types</option>
              <option value="service">Master Services (MSA)</option>
              <option value="nda">Non-Disclosure (NDA)</option>
              <option value="employment">Employment</option>
              <option value="lease">Commercial Lease</option>
              <option value="vendor">Vendor Procurement</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="signed">Signed</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>

        {/* Contract Repository Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Contract Document</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">AI Risk Index</th>
                  <th className="px-6 py-4">Contract Value</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No contracts found in this view. Click "Create / Upload Contract" to add one.
                    </td>
                  </tr>
                ) : (
                  contracts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/contracts/${c.id}`)}
                      className="cursor-pointer transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{c.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{c.contract_ref} • v{c.current_version}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold uppercase text-slate-600 dark:text-slate-300">
                        {c.contract_type}
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            c.status === 'active' || c.status === 'signed'
                              ? 'success'
                              : c.status === 'in_review'
                              ? 'warning'
                              : 'default'
                          }
                          className="text-[10px]"
                        >
                          {c.status.replace('_', ' ')}
                        </Badge>
                      </td>

                      <td className="px-6 py-4">
                        {c.ai_risk_score !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-lg px-2 py-0.5 text-[11px] font-extrabold ${
                                c.ai_risk_score > 60
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                                  : c.ai_risk_score > 30
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              }`}
                            >
                              {c.ai_risk_score}/100
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.ai_risk_score > 60 ? 'Red Flags' : 'Balanced'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Unanalyzed</span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {c.contract_value ? `₹${Number(c.contract_value).toLocaleString()}` : 'N/A'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                          <span>Inspect</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Upload Contract Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white my-8">
            <h3 className="text-base font-bold">Create or Upload Contract for AI Review</h3>
            <p className="mt-1 text-xs text-slate-500">
              ContractIQ AI will analyze text for uncapped liabilities, non-compete risks, and generate redline
              suggestions.
            </p>

            <form onSubmit={handleCreateContract} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Contract Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Software & Cloud Services Agreement"
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">Contract Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="service">Master Services Agreement (MSA)</option>
                    <option value="nda">Mutual Non-Disclosure Agreement (NDA)</option>
                    <option value="employment">Employment Agreement</option>
                    <option value="lease">Commercial Lease</option>
                    <option value="vendor">Vendor Procurement</option>
                    <option value="custom">Other Custom Contract</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Estimated Value (INR)</label>
                  <input
                    type="number"
                    value={newVal}
                    onChange={(e) => setNewVal(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500">Contract Agreement Text</label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewContent(
                        `MUTUAL NON-DISCLOSURE AGREEMENT\n\n1. CONFIDENTIALITY: Receiving Party shall keep all Disclosing Party information in perpetual confidence without time limit.\n\n2. INDEMNITY: Receiving Party agrees to indemnify Disclosing Party against ANY loss without monetary limit.\n\n3. NON-SOLICITATION: Receiving Party agrees not to hire Disclosing Party employees for 5 years.\n\n4. GOVERNING LAW: Governed by the laws of India.`
                      )
                    }
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Insert Sample High-Risk Draft
                  </button>
                </div>
                <textarea
                  rows={8}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste legal contract clauses or agreement clauses here for AI risk extraction..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="w-1/3 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-2/3 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {isCreating ? 'Analyzing Contract...' : 'Create & Run AI Analysis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
