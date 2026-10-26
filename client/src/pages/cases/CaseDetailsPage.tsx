import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  Building,
  User,
  Clock,
  ArrowLeft,
  FileText,
  Paperclip,
  CheckCircle2,
  Lock,
  Plus,
  Send,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { caseService } from '../../services/api';
import { LegalCase, CaseStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

const STAGES: Array<{ id: CaseStatus; label: string }> = [
  { id: 'enquiry', label: '1. Enquiry' },
  { id: 'consultation', label: '2. Consultation' },
  { id: 'engagement_pending', label: '3. Engagement' },
  { id: 'active_matter', label: '4. Active Matter' },
  { id: 'hearing_proceedings', label: '5. In Proceedings' },
  { id: 'closed', label: '6. Closed' },
];

export const CaseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [legalCase, setLegalCase] = useState<LegalCase | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add document modal
  const [docModalOpen, setDocModalOpen] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docCategory, setDocCategory] = useState<string>('petition');
  const [docUrl, setDocUrl] = useState<string>('https://example.com/legal_filing.pdf');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Chronology entry
  const [chronologyText, setChronologyText] = useState<string>('');

  const fetchCase = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await caseService.getById(id);
      if (res.data.success) {
        setLegalCase(res.data.case);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load case file.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  const handleStageChange = async (newStage: CaseStatus) => {
    if (!id) return;
    try {
      await caseService.update(id, { status: newStage });
      fetchCase();
    } catch (err) {
      console.error('Failed to change stage:', err);
    }
  };

  const handleAddChronology = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chronologyText.trim() || !id || !legalCase) return;
    try {
      const existing = Array.isArray(legalCase.chronology) ? [...legalCase.chronology] : [];
      const updated = [
        ...existing,
        {
          date: new Date().toISOString().split('T')[0],
          event: chronologyText.trim(),
        },
      ];
      await caseService.update(id, { chronology: updated });
      setChronologyText('');
      fetchCase();
    } catch (err) {
      console.error('Failed to update chronology:', err);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !id) return;
    try {
      setIsUploading(true);
      await caseService.addDocument(id, {
        title: docTitle.trim(),
        docCategory,
        fileUrl: docUrl,
        fileSize: 1024 * 320,
      });
      setDocModalOpen(false);
      setDocTitle('');
      fetchCase();
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading Case File...</p>
        </div>
      </div>
    );
  }

  if (error || !legalCase) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">Case File Not Accessible</h2>
        <p className="text-xs text-slate-500">{error || 'You lack authorization to access this case record.'}</p>
        <Link to="/cases" className="mt-4 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white">
          Back to Case Management
        </Link>
      </div>
    );
  }

  const isLawyer = user?.role === 'lawyer';

  return (
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/cases')}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                  {legalCase.case_ref}
                </span>
                <Badge variant="purple" className="text-[10px] uppercase">
                  {legalCase.status.replace('_', ' ')}
                </Badge>
              </div>
              <h1 className="mt-0.5 text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                {legalCase.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDocModalOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
            >
              <Plus className="h-4 w-4" />
              <span>Attach Case Document</span>
            </button>
          </div>
        </div>

        {/* Case Progression Stage Bar */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[650px] gap-2">
            {STAGES.map((s, idx) => {
              const currentIdx = STAGES.findIndex((st) => st.id === legalCase.status);
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={s.id}
                  onClick={() => isLawyer && handleStageChange(s.id)}
                  disabled={!isLawyer}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition ${
                    isCurrent
                      ? 'bg-blue-700 text-white shadow-sm dark:bg-blue-600'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-slate-50 text-slate-400 dark:bg-slate-800'
                  }`}
                >
                  {isPast ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Summary & Chronology (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Matter Details Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Case Matter Background</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {legalCase.summary || 'Initial case file opened on ContractIQ.'}
              </p>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Jurisdiction / Venue</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {legalCase.court_name || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Docket / FIR Number</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {legalCase.case_number || 'Pending allocation'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Advocate</span>
                  <p className="font-bold text-blue-700 dark:text-blue-400 mt-0.5">
                    {legalCase.lawyer_name} ({legalCase.practice_area})
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Next Scheduled Hearing</span>
                  <p className="font-bold text-rose-600 mt-0.5">
                    {legalCase.next_hearing_date
                      ? new Date(legalCase.next_hearing_date).toLocaleDateString()
                      : 'None scheduled'}
                  </p>
                </div>
              </div>
            </div>

            {/* Case Chronology & Timeline */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Case Chronology Timeline</h3>
                <span className="text-xs text-slate-400">Activity record</span>
              </div>

              <div className="mt-4 space-y-3">
                {Array.isArray(legalCase.chronology) &&
                  legalCase.chronology.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 shrink-0">
                        {item.date}
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">{item.event}</p>
                    </div>
                  ))}
              </div>

              {/* Add event form */}
              <form onSubmit={handleAddChronology} className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <input
                  type="text"
                  value={chronologyText}
                  onChange={(e) => setChronologyText(e.target.value)}
                  placeholder="Record new event / order / appearance..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
                >
                  Add Entry
                </button>
              </form>
            </div>
          </div>

          {/* Right: Privileged Documents & Notes (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            {/* Privileged Documents Vault */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Case Documents Vault</h3>
                <button
                  onClick={() => setDocModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Upload +
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {!legalCase.documents || legalCase.documents.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No documents attached to this case file.</p>
                ) : (
                  legalCase.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{doc.title}</p>
                          <p className="text-[10px] text-slate-400 uppercase">{doc.doc_category}</p>
                        </div>
                      </div>

                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                      >
                        Download
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Confidential Advocate Private Notes (Lawyer Only) */}
            {isLawyer && (
              <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-6 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
                  <Lock className="h-4 w-4" />
                  <h3 className="text-sm font-bold">Privileged Advocate Notes</h3>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Exclusively visible to you. Protected under Indian Evidence Act legal privilege.
                </p>
                <div className="mt-3 rounded-2xl bg-white p-3 text-xs text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                  {legalCase.private_lawyer_notes || 'No confidential strategy notes recorded yet.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Document Modal */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white">
            <h3 className="text-base font-bold">Attach Document to Case Matter</h3>
            <p className="mt-1 text-xs text-slate-500">Upload FIR, bail petition, affidavit, or evidentiary records.</p>

            <form onSubmit={handleUploadDocument} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Document Title</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Certified Copy of FIR No. 142/2026"
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Document Classification</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="fir">FIR / Police Complaint</option>
                  <option value="bail_application">Bail Application (437/438/439 CrPC)</option>
                  <option value="chargesheet">Police Chargesheet / Closure Report</option>
                  <option value="petition">Court Petition / Written Statement</option>
                  <option value="agreement">Contract / Commercial Deed</option>
                  <option value="title_deed">Property Title Deed / EC</option>
                  <option value="affidavit">Affidavit / Sworn Declaration</option>
                  <option value="evidence">Evidentiary Exhibit</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="w-1/3 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-2/3 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Save to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
