import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Clock,
  DollarSign,
  Building,
  CheckCircle2,
  AlertCircle,
  Upload,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { lawyerService, verificationService } from '../../services/api';
import { LawyerProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const LawyerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [headline, setHeadline] = useState<string>('');
  const [primarySpecialty, setPrimarySpecialty] = useState<string>('Criminal Lawyer');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [barNumber, setBarNumber] = useState<string>('');
  const [barState, setBarState] = useState<string>('');
  const [fee15, setFee15] = useState<number>(499);
  const [fee30, setFee30] = useState<number>(899);
  const [fee60, setFee60] = useState<number>(1499);
  const [bio, setBio] = useState<string>('');
  const [city, setCity] = useState<string>('New Delhi');
  const [state, setState] = useState<string>('Delhi');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [bankIfsc, setBankIfsc] = useState<string>('');
  const [bankHolder, setBankHolder] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  // Verification Form State
  const [barCertUrl, setBarCertUrl] = useState<string>('https://example.com/bar_cert.pdf');
  const [enrollmentYear, setEnrollmentYear] = useState<number>(2015);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user?.id) {
          const res = await lawyerService.getLawyerById(user.id);
          if (res.data.success && res.data.lawyer) {
            const l = res.data.lawyer;
            setHeadline(l.headline || '');
            setPrimarySpecialty(l.primary_specialty || 'Criminal Lawyer');
            setExperienceYears(l.experience_years || 5);
            setBarNumber(l.bar_council_number || '');
            setBarState(l.bar_state || '');
            setFee15(l.consultation_fee_15 || 499);
            setFee30(l.consultation_fee_30 || 899);
            setFee60(l.consultation_fee_60 || 1499);
            setBio(l.bio || '');
            setCity(l.city || 'New Delhi');
            setState(l.state || 'Delhi');
            setBankAccount(l.bank_account_number || '');
            setBankIfsc(l.bank_ifsc || '');
            setBankHolder(l.bank_holder_name || '');
          }
        }
      } catch (err) {
        console.error('Failed to load advocate profile:', err);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMessage(null);
      await lawyerService.updateProfile({
        headline,
        primarySpecialty,
        experienceYears,
        barCouncilNumber: barNumber,
        barState,
        consultationFee15: fee15,
        consultationFee30: fee30,
        consultationFee60: fee60,
        bio,
        city,
        state,
        bankAccountNumber: bankAccount,
        bankIfsc,
        bankHolderName: bankHolder,
      });
      setMessage('Profile settings & fees saved successfully.');
    } catch (err) {
      console.error('Save failed:', err);
      setMessage('Error saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barNumber.trim() || !barState.trim()) {
      alert('Please enter your Bar Registration Number and State.');
      return;
    }
    try {
      setIsVerifying(true);
      await verificationService.submit({
        barRegistrationNumber: barNumber.trim(),
        barCouncilState: barState.trim(),
        enrollmentYear,
        barCertificateUrl: barCertUrl,
      });
      alert('Verification application submitted for institutional review.');
    } catch (err) {
      console.error('Verification submit error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/lawyer/dashboard')}
            className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Advocate Profile & Fee Settings</h1>
            <p className="text-xs text-slate-500">Configure your consultation pricing, specialties, and bank payouts</p>
          </div>
        </div>

        {message && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Section 1: Professional Identity */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Professional Information</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-500">Primary Practice Specialty</label>
                <select
                  value={primarySpecialty}
                  onChange={(e) => setPrimarySpecialty(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="Criminal Lawyer">Criminal Lawyer</option>
                  <option value="Corporate and Commercial Lawyer">Corporate and Commercial Lawyer</option>
                  <option value="Contract Lawyer">Contract Lawyer</option>
                  <option value="Family and Divorce Lawyer">Family and Divorce Lawyer</option>
                  <option value="Property and Real Estate Lawyer">Property and Real Estate Lawyer</option>
                  <option value="Civil Litigation Lawyer">Civil Litigation Lawyer</option>
                  <option value="Tax and GST Lawyer">Tax and GST Lawyer</option>
                  <option value="Intellectual Property Lawyer">Intellectual Property Lawyer</option>
                  <option value="Cybercrime and Technology Lawyer">Cybercrime and Technology Lawyer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Experience (Years)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500">Professional Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Criminal Defense & Bail Counsel | High Court of Delhi"
                className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500">Biography & Practice Credentials</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Consultation Fee Tiers */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Consultation Fees (INR)</h3>
            <p className="text-xs text-slate-500">
              Set transparent fixed fees. Clients see these exact amounts before booking.
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500">15-Min Quick Call</label>
                <input
                  type="number"
                  step="50"
                  value={fee15}
                  onChange={(e) => setFee15(parseFloat(e.target.value))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">30-Min Standard</label>
                <input
                  type="number"
                  step="50"
                  value={fee30}
                  onChange={(e) => setFee30(parseFloat(e.target.value))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">60-Min In-Depth</label>
                <input
                  type="number"
                  step="50"
                  value={fee60}
                  onChange={(e) => setFee60(parseFloat(e.target.value))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bank Account for Settlement Payouts */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bank Account Details (Payouts)</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Account Holder Name</label>
                <input
                  type="text"
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Account Number</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">IFSC Code</label>
                <input
                  type="text"
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-blue-800 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </form>

        {/* Section 4: Bar Council Verification Submission */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bar Council Verification</h3>
              <p className="text-xs text-slate-500">Submit your Bar Council credentials to unlock the verified advocate badge</p>
            </div>
            {user?.lawyerProfile?.is_verified ? (
              <Badge variant="success">Verified Active</Badge>
            ) : (
              <Badge variant="warning">Verification Required</Badge>
            )}
          </div>

          <form onSubmit={handleApplyVerification} className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Bar Enrollment Number</label>
                <input
                  type="text"
                  required
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value)}
                  placeholder="e.g. D/1842/2012"
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Bar Council State</label>
                <input
                  type="text"
                  required
                  value={barState}
                  onChange={(e) => setBarState(e.target.value)}
                  placeholder="e.g. Bar Council of Delhi"
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Enrollment Year</label>
                <input
                  type="number"
                  value={enrollmentYear}
                  onChange={(e) => setEnrollmentYear(parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="rounded-2xl border border-blue-600 bg-blue-50 px-5 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
            >
              {isVerifying ? 'Submitting Application...' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
