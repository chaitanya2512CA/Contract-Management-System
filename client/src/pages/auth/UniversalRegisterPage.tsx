import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Lock, Mail, User, Phone, Briefcase, Building, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UniversalRegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'client' | 'lawyer' | 'business'>('client');
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
        email: email.trim(),
        password,
        role,
        phone,
        companyName,
        city,
        state,
        primarySpecialty,
        experienceYears,
        barCouncilNumber,
        barState,
      });

      if (user.role === 'lawyer') {
        navigate('/lawyer/dashboard');
      } else if (user.role === 'business') {
        navigate('/business/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 shadow-md">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">ContractIQ</span>
          </Link>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create your legal account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Join thousands of clients, advocates, and enterprises on ContractIQ
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              role === 'client' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            Individual Client
          </button>
          <button
            type="button"
            onClick={() => setRole('lawyer')}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              role === 'lawyer' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            Advocate / Lawyer
          </button>
          <button
            type="button"
            onClick={() => setRole('business')}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              role === 'business' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            Enterprise CLM
          </button>
        </div>

        {/* Form Container */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {role === 'lawyer' ? 'Advocate Full Name' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma or Adv. Ananya Roy"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            {role === 'business' && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Organization / Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Dynamics Technologies Pvt. Ltd."
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            )}

            {role === 'lawyer' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Primary Specialty</label>
                    <select
                      value={primarySpecialty}
                      onChange={(e) => setPrimarySpecialty(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
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
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Years of Experience</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(parseInt(e.target.value, 10))}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bar Registration Number</label>
                    <input
                      type="text"
                      required
                      value={barCouncilNumber}
                      onChange={(e) => setBarCouncilNumber(e.target.value)}
                      placeholder="e.g. D/1842/2012"
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bar Council State</label>
                    <input
                      type="text"
                      required
                      value={barState}
                      onChange={(e) => setBarState(e.target.value)}
                      placeholder="e.g. Bar Council of Delhi"
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-2xl bg-blue-700 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-800 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-700 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
