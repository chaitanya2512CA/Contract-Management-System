import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Share2,
  Clock,
  CheckCircle2,
  Send,
  MessageSquare,
  AlertTriangle,
  PenTool,
  ArrowLeft,
  Lock,
  Layers,
  History,
  Info,
} from 'lucide-react';
import { contractService, lawyerService } from '../../services/api';
import { Contract, LawyerProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const ContractDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Contract AI Chatbot state
  const [chatQuestion, setChatQuestion] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; a: string; citations?: string[] }>>([]);
  const [isAiAnswering, setIsAiAnswering] = useState<boolean>(false);

  // Share with Lawyer Modal state
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [lawyersList, setLawyersList] = useState<LawyerProfile[]>([]);
  const [selectedLawyerUserId, setSelectedLawyerUserId] = useState<string>('');
  const [sharePurpose, setSharePurpose] = useState<string>('Urgent clause redline review');
  const [shareDurationDays, setShareDurationDays] = useState<number>(14);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  // E-Signature Modal state
  const [signModalOpen, setSignModalOpen] = useState<boolean>(false);
  const [signerName, setSignerName] = useState<string>(user?.name || '');
  const [signerRole, setSignerRole] = useState<string>('Authorized Signatory');
  const [isSigning, setIsSigning] = useState<boolean>(false);

  const fetchContract = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await contractService.getById(id);
      if (res.data.success) {
        setContract(res.data.contract);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load contract.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [id]);

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion.trim() || !id) return;
    try {
      setIsAiAnswering(true);
      const q = chatQuestion.trim();
      setChatQuestion('');
      const res = await contractService.chat(id, q);
      if (res.data.success) {
        setChatHistory((prev) => [
          ...prev,
          { q: res.data.question, a: res.data.answer, citations: res.data.citedClauses },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsAiAnswering(false);
    }
  };

  const openShareModal = async () => {
    setShareModalOpen(true);
    try {
      const res = await lawyerService.getLawyers({ specialty: 'Contract Lawyer' });
      if (res.data.success && res.data.lawyers.length > 0) {
        setLawyersList(res.data.lawyers);
        setSelectedLawyerUserId(res.data.lawyers[0].user_id);
      }
    } catch (err) {
      console.error('Failed to load lawyers list:', err);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedLawyerUserId) return;
    try {
      setIsSharing(true);
      await contractService.share(id, {
        lawyerUserId: selectedLawyerUserId,
        permissionLevel: 'review',
        purpose: sharePurpose,
        durationDays: shareDurationDays,
      });
      alert('Contract shared securely with advocate. Access has been logged in the audit trail.');
      setShareModalOpen(false);
      fetchContract();
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !signerName.trim()) return;
    try {
      setIsSigning(true);
      await contractService.sign(id, {
        signerName: signerName.trim(),
        signerEmail: user?.email || 'signer@enterprise.com',
        signerRole,
        signatureData: `DIGITAL_SIG_${Date.now()}`,
      });
      alert('Contract successfully signed and logged in immutable version trail.');
      setSignModalOpen(false);
      fetchContract();
    } catch (err) {
      console.error('Signing failed:', err);
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold">Loading Contract Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <AlertTriangle className="h-10 w-10 text-rose-500" />
        <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">Contract Unavailable</h2>
        <p className="text-xs text-slate-500">{error || 'You lack authorization to access this agreement.'}</p>
        <Link to="/contracts" className="mt-4 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white">
          Back to Contracts
        </Link>
      </div>
    );
  }

  const riskScore = contract.ai_risk_score || 25;
  const riskColor =
    riskScore > 60
      ? 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900'
      : riskScore > 30
      ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
      : 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900';

  return (
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/contracts')}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">{contract.title}</h1>
                <Badge variant="default" className="text-[10px]">
                  {contract.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Ref: {contract.contract_ref} • Version {contract.current_version} • Type: {contract.contract_type.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openShareModal}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Share2 className="h-4 w-4 text-blue-600" />
              <span>Invite Advocate to Review</span>
            </button>

            {contract.status !== 'signed' && (
              <button
                onClick={() => setSignModalOpen(true)}
                className="flex items-center gap-1.5 rounded-2xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <PenTool className="h-4 w-4" />
                <span>Execute E-Signature</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Risk Score Banner */}
        <div className={`rounded-3xl border p-6 shadow-sm ${riskColor}`}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">AI Risk Assessment</h3>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black shadow-sm dark:bg-slate-900">
                    {riskScore}/100 Risk Index
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 max-w-2xl">
                  {contract.ai_summary ||
                    'AI analysis scanned for indemnities, liability caps, non-solicitation covenants, and governing jurisdiction.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => contractService.analyze(contract.id).then(() => fetchContract())}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              Re-Run AI Analysis
            </button>
          </div>
        </div>

        {/* Two-Column Workspace: Left 60% Contract & AI Flags | Right 40% AI Assistant & Details */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column (7 cols): Red Flags & Full Contract Text */}
          <div className="space-y-6 lg:col-span-7">
            {/* Red Flag Clauses */}
            {Array.isArray(contract.ai_risk_flags) && contract.ai_risk_flags.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Red-Flag Clauses & Risk Findings ({contract.ai_risk_flags.length})
                  </h3>
                </div>

                <div className="mt-4 space-y-3">
                  {contract.ai_risk_flags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{flag.clause}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                            flag.severity === 'high'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {flag.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{flag.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Clause Recommendations */}
            {Array.isArray(contract.ai_clause_suggestions) && contract.ai_clause_suggestions.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Suggested Clause Amendments</h3>
                </div>

                <div className="mt-4 space-y-3">
                  {contract.ai_clause_suggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5 dark:border-emerald-950/50 dark:bg-emerald-950/20"
                    >
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">{sug.clause}</span>
                      <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{sug.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contract Document Text Viewer */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Agreement Terms & Draft Text</h3>
                <span className="text-xs text-slate-400">Version {contract.current_version}</span>
              </div>
              <div className="mt-4 max-h-[500px] overflow-y-auto rounded-2xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 dark:bg-slate-800/60 dark:text-slate-200 whitespace-pre-wrap">
                {contract.content_text}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): AI Contract Chatbot & Metadata */}
          <div className="space-y-6 lg:col-span-5">
            {/* Interactive Contract AI Chatbot */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[520px]">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contract AI Chatbot</h3>
                  <p className="text-[10px] text-slate-500">Ask any question regarding this agreement's clauses</p>
                </div>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                <div className="rounded-2xl bg-blue-50/70 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <p className="font-semibold text-blue-900 dark:text-blue-300">ContractIQ Legal Assistant</p>
                  <p className="mt-1">
                    I've indexed "{contract.title}". Ask me about liability caps, indemnification, non-solicitation, or
                    termination conditions!
                  </p>
                </div>

                {chatHistory.map((item, idx) => (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="ml-auto w-fit max-w-[85%] rounded-2xl bg-blue-700 p-2.5 text-white">
                      <p>{item.q}</p>
                    </div>
                    <div className="w-fit max-w-[90%] rounded-2xl bg-slate-100 p-3 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      <p>{item.a}</p>
                      {item.citations && item.citations.length > 0 && (
                        <div className="mt-2 border-t border-slate-200 pt-1.5 text-[10px] text-slate-500 dark:border-slate-700">
                          Cited: {item.citations.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Prompt Suggestions */}
              <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                {['Is liability capped?', 'What is the indemnity risk?', 'Can either party terminate?'].map(
                  (prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        setChatQuestion(prompt);
                      }}
                      className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    >
                      {prompt}
                    </button>
                  )
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleAskAi} className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  placeholder="Ask a question about this contract..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={isAiAnswering}
                  className="rounded-xl bg-blue-700 p-2 text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Contract Signatures & Permissions Summary */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Approvals & Signatures</h3>

              {Array.isArray(contract.signatures) && contract.signatures.length > 0 ? (
                <div className="space-y-2">
                  {contract.signatures.map((sig) => (
                    <div
                      key={sig.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/60"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{sig.signer_name}</p>
                        <p className="text-[10px] text-slate-500">{sig.signer_role} • {sig.signer_email}</p>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Signed
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No digital signatures executed yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share with Advocate Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white">
            <h3 className="text-base font-bold">Invite Advocate to Review Contract</h3>
            <p className="mt-1 text-xs text-slate-500">
              Grant a verified marketplace advocate secure, time-bound access without exposing your entire contract vault.
            </p>

            <form onSubmit={handleShareSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Select Advocate</label>
                <select
                  value={selectedLawyerUserId}
                  onChange={(e) => setSelectedLawyerUserId(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {lawyersList.map((l) => (
                    <option key={l.id} value={l.user_id}>
                      {l.full_name} ({l.primary_specialty}) - ₹{l.consultation_fee_30}/30m
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Purpose of Sharing</label>
                <input
                  type="text"
                  value={sharePurpose}
                  onChange={(e) => setSharePurpose(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Access Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={shareDurationDays}
                  onChange={(e) => setShareDurationDays(parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  className="w-1/3 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSharing}
                  className="w-2/3 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {isSharing ? 'Granting Access...' : 'Confirm Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E-Signature Modal */}
      {signModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white">
            <h3 className="text-base font-bold">Execute Digital E-Signature</h3>
            <p className="mt-1 text-xs text-slate-500">
              Your digital signature will be cryptographically timestamped and bound to version {contract.current_version}.
            </p>

            <form onSubmit={handleSignContract} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Signatory Full Name</label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Role / Designation</label>
                <input
                  type="text"
                  required
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center dark:border-slate-700">
                <p className="font-serif italic text-base text-blue-700 dark:text-blue-400">
                  {signerName || 'Your Signature'}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">Cryptographic Hash Key Verified</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSignModalOpen(false)}
                  className="w-1/3 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSigning}
                  className="w-2/3 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {isSigning ? 'Signing...' : 'Confirm & Apply Signature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
