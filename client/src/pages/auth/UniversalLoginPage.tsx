import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Scale,
  Lock,
  Mail,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UniversalLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState<string>('client@contractiq.com');
  const [password, setPassword] = useState<string>('Client@12345');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const user = await login({ email: email.trim(), password });

      if (redirect) {
        navigate(`/${redirect}`);
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'lawyer') {
        navigate('/lawyer/dashboard');
      } else if (user.role === 'business') {
        navigate('/business/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Unable to reach the authentication server. Please check your network connection.');
      } else {
        setError('Invalid login credentials. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 shadow-md">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">ContractIQ</span>
          </Link>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign in to your legal account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Access your consultations, AI contract reviews, and advocate workspace
          </p>
        </div>

        {/* Demo Fast Switcher Pills */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
            Click to Auto-Fill Pre-Seeded Demo Account
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => handleQuickFill('client@contractiq.com', 'Client@12345')}
              className="rounded-xl border border-slate-100 bg-slate-50 py-1.5 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800"
            >
              Client (Rahul)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('criminal.law@contractiq.com', 'Lawyer@12345')}
              className="rounded-xl border border-slate-100 bg-slate-50 py-1.5 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800"
            >
              Criminal Lawyer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('contract.law@contractiq.com', 'Lawyer@12345')}
              className="rounded-xl border border-slate-100 bg-slate-50 py-1.5 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800"
            >
              Contract Lawyer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('family.law@contractiq.com', 'Lawyer@12345')}
              className="rounded-xl border border-slate-100 bg-slate-50 py-1.5 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800"
            >
              Family Lawyer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('business@contractiq.com', 'Business@12345')}
              className="rounded-xl border border-slate-100 bg-slate-50 py-1.5 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800"
            >
              Enterprise CLM
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@contractiq.com', 'Admin@12345')}
              className="rounded-xl border border-slate-100 bg-slate-50 py-1.5 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800"
            >
              Super Admin
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@contractiq.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-blue-700 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-800 disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-700 hover:underline">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
