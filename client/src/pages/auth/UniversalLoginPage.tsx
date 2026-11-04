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

  const [email, setEmail] = useState<string>('client@jurisflow.com');
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
    <div className="flex min-h-screen items-center justify-center bg-[#080808] p-4 text-[#F5E6C4]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#262118] bg-[#121212] text-[#D4AF37] shadow-sm transition group-hover:border-[#D4AF37]">
              <Scale className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <span className="text-2xl font-black text-white group-hover:text-[#D4AF37] transition">
              JurisFlow
            </span>
          </Link>
          <h2 className="mt-4 text-xl font-black tracking-tight text-white">
            Welcome to JurisFlow
          </h2>
          <p className="mt-1 text-xs text-[#A39E93] font-medium">
            Your Legal World, Organized in One Flow.
          </p>
        </div>

        {/* Demo Fast Switcher Pills */}
        <div className="rounded-2xl border border-[#262118] bg-[#121212] p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] text-center">
            Click to Auto-Fill Pre-Seeded Demo Account
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => handleQuickFill('client@jurisflow.com', 'Client@12345')}
              className="rounded-xl border border-[#262118] bg-[#1A1A1A] py-2 text-center text-[#F5E6C4] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Client (Rahul)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('business@jurisflow.com', 'Business@12345')}
              className="rounded-xl border border-[#262118] bg-[#1A1A1A] py-2 text-center text-[#F5E6C4] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Enterprise CLM
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@jurisflow.com', 'Admin@12345')}
              className="rounded-xl border border-[#262118] bg-[#1A1A1A] py-2 text-center text-[#F5E6C4] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Super Admin
            </button>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#262118] text-center">
            <Link
              to="/register?role=lawyer"
              className="text-[11px] font-semibold text-[#D4AF37] hover:underline"
            >
              Are you an advocate? Register on JurisFlow →
            </Link>
          </div>
        </div>

        {/* Login Form */}
        <div className="rounded-3xl border border-[#262118] bg-[#121212] p-6 shadow-2xl">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-900/50 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#A39E93]">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A39E93]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@jurisflow.com"
                  className="w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] py-3 pl-10 pr-3 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#A39E93]">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A39E93]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] py-3 pl-10 pr-3 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-[#D4AF37] py-3.5 text-xs font-black text-[#080808] shadow-md transition hover:bg-[#AA7C11] disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#A39E93]">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-[#D4AF37] hover:underline">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
