import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Smartphone,
  QrCode,
  FileCheck,
} from 'lucide-react';
import { paymentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  advocateId?: string;
  advocateName?: string;
  consultationId?: string;
  serviceRequestId?: string;
  purpose?: string;
  onSuccess?: (payment: any) => void;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  advocateId,
  advocateName,
  consultationId,
  serviceRequestId,
  purpose = 'Legal Consultation Retainer',
  onSuccess,
}) => {
  const { user } = useAuth();

  const merchantUpiId =
    import.meta.env.VITE_MERCHANT_UPI_ID || '7558343192-1@nyes';
  const merchantName =
    import.meta.env.VITE_MERCHANT_NAME || 'JurisFlow';

  const [step, setStep] = useState<'pay' | 'utr' | 'success'>('pay');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedPayment, setSubmittedPayment] = useState<any>(null);

  if (!isOpen) return null;

  // Static QR Code URI: Omits '&am=' for 100% scanning compatibility across all P2P apps (GPay, PhonePe, Paytm)
  const qrCodeUri = `upi://pay?pa=${encodeURIComponent(
    merchantUpiId
  )}&pn=${encodeURIComponent(merchantName)}&cu=INR`;

  // Mobile Deep Link Intent: Contains '&am=' so mobile UPI apps launch pre-filled
  const mobileIntentUri = `upi://pay?pa=${encodeURIComponent(
    merchantUpiId
  )}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(
    2
  )}&cu=INR&tn=${encodeURIComponent(purpose)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 12
    const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 12);
    setUtrNumber(cleanDigits);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{12}$/.test(utrNumber)) {
      setErrorMessage(
        'Please enter the full 12-digit UPI Reference / UTR Number found on your payment receipt.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        userId: user?.id,
        advocateId: advocateId || undefined,
        amount: Number(amount),
        utrNumber: utrNumber.trim(),
        consultationId: consultationId || undefined,
        serviceRequestId: serviceRequestId || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await paymentService.submitUpi(payload);

      if (res.data?.success) {
        setSubmittedPayment(res.data.payment);
        setStep('success');
        if (onSuccess) {
          onSuccess(res.data.payment);
        }
      } else {
        throw new Error(res.data?.message || 'Failed to submit UTR.');
      }
    } catch (err: any) {
      console.error('[UPI Modal] Submission error:', err);
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        'Could not submit payment. Please verify your UTR and try again.';
      setErrorMessage(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setStep('pay');
    setUtrNumber('');
    setNotes('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#262118] bg-[#0E0E0E] p-6 shadow-2xl text-[#F5E6C4] sm:p-7">
        {/* Subtle Ambient Gold Glow Background */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#262118] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#1A1A1A] text-[#D4AF37] shadow-inner">
              <span className="text-base font-black">⚖️</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black tracking-wide text-white">
                  JurisFlow Direct UPI
                </h3>
                <span className="inline-flex items-center gap-0.5 rounded-full border border-[#D4AF37]/30 bg-[#1A1A1A] px-2 py-0.5 text-[9px] font-bold text-[#D4AF37]">
                  0% Gateway Fee
                </span>
              </div>
              <p className="text-[11px] text-[#A39E93]">
                {advocateName ? `Advocate: ${advocateName}` : purpose}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            className="rounded-xl border border-[#262118] p-1.5 text-[#A39E93] transition hover:border-[#D4AF37]/50 hover:bg-[#1A1A1A] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* STEP 1: SCAN & PAY VIA UPI */}
        {step === 'pay' && (
          <div className="mt-5 space-y-4">
            {/* Amount Banner */}
            <div className="rounded-2xl border border-[#262118] bg-gradient-to-br from-[#161616] to-[#0A0A0A] p-4 text-center shadow-md">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A39E93]">
                Total Payable Amount
              </span>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="text-3xl font-black text-[#D4AF37] tracking-tight">
                  ₹{Number(amount).toLocaleString('en-IN')}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAmount}
                  title="Copy Amount"
                  className="rounded-lg border border-[#262118] bg-[#1A1A1A] p-1.5 text-xs text-[#A39E93] hover:text-[#D4AF37] transition"
                >
                  {copiedAmount ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-[#A39E93]">
                Scan with GPay, PhonePe, Paytm, or BHIM & pay the exact amount
              </p>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#262118] bg-[#121212] p-5 shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D4AF37] mb-3">
                <QrCode className="h-3.5 w-3.5" />
                <span>Scan QR with Any UPI Banking App</span>
              </div>

              {/* High-contrast white QR container */}
              <div className="rounded-2xl bg-white p-3.5 shadow-xl ring-2 ring-[#D4AF37]/40">
                <QRCodeSVG
                  value={qrCodeUri}
                  size={170}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* UPI ID Details Pill */}
              <div className="mt-3.5 flex items-center justify-between gap-2 w-full rounded-xl border border-[#262118] bg-[#1A1A1A] px-3 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-[#A39E93] block">
                    Merchant UPI ID
                  </span>
                  <span className="font-mono font-bold text-[#F5E6C4] truncate block">
                    {merchantUpiId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1 rounded-lg border border-[#D4AF37]/40 bg-[#121212] px-2.5 py-1 text-[11px] font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#080808] transition"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Intent Payment Button (Opens native UPI app) */}
            <a
              href={mobileIntentUri}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E5C358] to-[#AA7C11] py-3 text-xs font-black text-[#080808] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110 active:scale-[0.98]"
            >
              <Smartphone className="h-4 w-4" />
              <span>Pay in UPI App (GPay / PhonePe / Paytm)</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {/* Step Progression Button */}
            <button
              type="button"
              onClick={() => setStep('utr')}
              className="flex items-center justify-center gap-2 w-full rounded-2xl border border-[#D4AF37]/50 bg-[#1A1A1A] py-3 text-xs font-bold text-[#F5E6C4] hover:bg-[#262118] hover:text-white transition"
            >
              <span>I Have Completed Payment → Enter 12-Digit UTR</span>
              <ArrowRight className="h-4 w-4 text-[#D4AF37]" />
            </button>
          </div>
        )}

        {/* STEP 2: ENTER 12-DIGIT UTR NUMBER */}
        {step === 'utr' && (
          <form onSubmit={handleSubmitUtr} className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[#262118] bg-[#141414] p-3.5 text-xs text-[#A39E93]">
              <div className="flex items-center gap-1.5 font-bold text-[#F5E6C4]">
                <FileCheck className="h-4 w-4 text-[#D4AF37]" />
                <span>Where to find your 12-digit UTR:</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed">
                Open your payment app history (Google Pay, PhonePe, Paytm, or
                BHIM). Look for <strong className="text-white">UPI Ref No.</strong>,{' '}
                <strong className="text-white">UTR</strong>, or{' '}
                <strong className="text-white">Google Transaction ID</strong> (12
                numeric digits).
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#A39E93]">
                  12-Digit UTR / UPI Reference No. *
                </label>
                <span className="text-[11px] font-mono text-[#D4AF37]">
                  {utrNumber.length} / 12 digits
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={12}
                value={utrNumber}
                onChange={handleUtrChange}
                placeholder="e.g. 431928472910"
                className="mt-1.5 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] px-4 py-3 font-mono text-sm tracking-wider text-white placeholder:text-[#666158] focus:border-[#D4AF37] focus:outline-none transition text-center"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#A39E93]">
                Optional Note / Sender Name
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid from HDFC account of Rahul Sharma"
                className="mt-1.5 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] px-3.5 py-2.5 text-xs text-[#F5E6C4] placeholder:text-[#666158] focus:border-[#D4AF37] focus:outline-none transition"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('pay')}
                className="w-1/3 rounded-2xl border border-[#262118] bg-[#1A1A1A] py-3 text-xs font-semibold text-[#A39E93] hover:text-[#F5E6C4] transition"
              >
                Back to QR
              </button>

              <button
                type="submit"
                disabled={isSubmitting || utrNumber.length !== 12}
                className="w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] py-3 text-xs font-black text-[#080808] shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#AA7C11] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Submitting Verification...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>I Have Completed Payment → Unlock Consultation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUBMISSION CONFIRMED / UNDER VERIFICATION */}
        {step === 'success' && (
          <div className="mt-5 space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#1A1A1A] to-[#121212] text-[#D4AF37] shadow-xl">
              <CheckCircle2 className="h-9 w-9 text-[#D4AF37]" />
            </div>

            <div>
              <h4 className="text-base font-black text-white">
                Payment Submitted for Verification
              </h4>
              <p className="mt-1 text-xs text-[#A39E93]">
                Your 12-digit UTR has been logged in our secure institutional
                ledger.
              </p>
            </div>

            <div className="rounded-2xl border border-[#262118] bg-[#141414] p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#A39E93]">Amount:</span>
                <span className="font-bold text-[#D4AF37]">₹{amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A39E93]">UTR Reference:</span>
                <span className="font-mono font-bold text-white">
                  {utrNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A39E93]">Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                  <Clock className="h-3 w-3" />
                  Pending Compliance Verification
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A39E93]">Confirmation Email:</span>
                <span className="text-[#F5E6C4]">{user?.email || 'Registered Email'}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#A39E93]">
              Once verified by our finance desk, an automated receipt and booking
              confirmation email will be dispatched to your inbox.
            </p>

            <button
              type="button"
              onClick={handleModalClose}
              className="w-full rounded-2xl bg-[#D4AF37] py-3 text-xs font-black text-[#080808] hover:bg-[#AA7C11] transition active:scale-[0.98]"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}

        {/* Security & Privilege Notice */}
        <div className="mt-5 border-t border-[#262118] pt-3 text-center text-[10px] text-[#666158] flex items-center justify-center gap-1.5">
          <Lock className="h-3 w-3 text-[#D4AF37]" />
          <span>Direct Bank-to-Bank UPI • Encrypted & Audit-Logged</span>
        </div>
      </div>
    </div>
  );
};
