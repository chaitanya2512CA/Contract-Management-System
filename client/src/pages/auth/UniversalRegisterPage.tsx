import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Scale, Lock, Mail, User, Phone, Briefcase, Building, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UniversalRegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const initialRole = (roleParam === 'lawyer' || roleParam === 'advocate')
    ? 'lawyer'
    : (roleParam === 'business' ? 'business' : 'client');

  const [role, setRole] = useState<'client' | 'lawyer' | 'business'>(initialRole);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [city, setCity] = useState<string>('New Delhi');
  const [state, setState] = useState<string>('Delhi');

  // Lawyer specific
  const [primarySpecialty, setPrimarySpecialty] = useState<string>('Contract Lawyer');
  const [experienceYears, setExperienceYears] = useState<number>(3);
  const [barCouncilNumber, setBarCouncilNumber] = useState<string>('');
  const [barState, setBarState] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const user = await register({
        name: name.trim(),
        fullName: name.trim(),
        email: email.trim(),
        password,
        role,
        phone,
        companyName,
        city,
        state: (role === 'lawyer' && barState ? barState : state) || 'Delhi',
        primarySpecialty,
        experienceYears: Number(experienceYears) || 3,
        barCouncilNumber: barCouncilNumber.trim(),
        barRegistrationNumber: barCouncilNumber.trim(),
        barState: barState || state || 'Delhi',
      });

      if (user.role === 'lawyer') {
        navigate('/lawyer/dashboard');
      } else if (user.role === 'business') {
        navigate('/business/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err: any) {
      console.error('[AUTH Registration Error UI]:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Unable to reach the authentication server. Please check your network connection.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] p-4 py-12 text-[#F5E6C4]">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#262118] bg-[#121212] text-[#D4AF37] shadow-sm transition group-hover:border-[#D4AF37]">
              <Scale className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <span className="text-2xl font-black text-white group-hover:text-[#D4AF37] transition">
              JurisFlow
            </span>
          </Link>
          <h2 className="mt-4 text-xl font-black tracking-tight text-white">Create your JurisFlow account</h2>
          <p className="mt-1 text-xs text-[#A39E93] font-medium">Your Legal World, Organized in One Flow.</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#262118] bg-[#121212] p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`rounded-xl py-2.5 text-xs font-bold transition ${
              role === 'client' ? 'bg-[#D4AF37] text-[#080808]' : 'text-[#A39E93] hover:text-[#F5E6C4]'
            }`}
          >
            Individual Client
          </button>
          <button
            type="button"
            onClick={() => setRole('lawyer')}
            className={`rounded-xl py-2.5 text-xs font-bold transition ${
              role === 'lawyer' ? 'bg-[#D4AF37] text-[#080808]' : 'text-[#A39E93] hover:text-[#F5E6C4]'
            }`}
          >
            Advocate / Lawyer
          </button>
          <button
            type="button"
            onClick={() => setRole('business')}
            className={`rounded-xl py-2.5 text-xs font-bold transition ${
              role === 'business' ? 'bg-[#D4AF37] text-[#080808]' : 'text-[#A39E93] hover:text-[#F5E6C4]'
            }`}
          >
            Enterprise CLM
          </button>
        </div>

        {/* Form Container */}
        <div className="rounded-3xl border border-[#262118] bg-[#121212] p-6 shadow-2xl">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-900/50 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#A39E93]">
                {role === 'lawyer' ? 'Advocate Full Name' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adv. Rajesh Sharma or Rahul Sharma"
                className="mt-1 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] p-3 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#A39E93]">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="mt-1 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] p-3 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#A39E93]">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="mt-1 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] p-3 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {role === 'business' && (
              <div>
                <label className="text-xs font-bold text-[#A39E93]">Organization / Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Dynamics Technologies Pvt. Ltd."
                  className="mt-1 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] p-3 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            )}

            {role === 'lawyer' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#A39E93]">Primary Specialty</label>
                    <select
                      value={primarySpecialty}
                      onChange={(e) => setPrimarySpecialty(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] p-3 text-xs text-[#F5E6C4] focus:border-[#D4AF37] focus:outline-none"
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
                    <label className="text-xs font-bold text-[#A39E93]">Years of Experience</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(parseInt(e.target.value, 10))}
                      className="mt-1 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] p-3 text-xs text-[#F5E6C4] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#A39E93]">Bar Registration Number</label>
                    <input
                      type="text"
                      required
                      value={barCouncilNumber}
                      onChange={(e) => setBarCouncilNumber(e.target.value)}
                      placeholder="e.g. D/1842/2012"
                      className="mt-1 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] p-3 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#A39E93]">Bar Council State</label>
                    <input
                      type="text"
                      required
                      value={barState}
                      onChange={(e) => setBarState(e.target.value)}
                      placeholder="e.g. Bar Council of Delhi"
                      className="mt-1 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] p-3 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-2xl bg-[#D4AF37] py-3.5 text-xs font-black text-[#080808] shadow-md transition hover:bg-[#AA7C11] disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#A39E93]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#D4AF37] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
