import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Scale,
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Server,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await loginAdmin({ email: email.trim(), password });
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.warn('[AdminLogin] Authentication attempt failed:', {
        status: err.response?.status,
        code: err.code,
        message: err.response?.data?.message || err.message,
      });

      if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setErrorMessage(
          'Unable to reach the authentication server. Please ensure the backend server is running on port 5000 or check your network connection.'
        );
      } else if (err.response?.status === 503) {
        setErrorMessage(
          err.response?.data?.message || 'Database service unavailable. Please check the database connection.'
        );
      } else {
        setErrorMessage('Authentication failed. Invalid administrator credentials or unauthorized role.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#080808] py-12 sm:px-6 lg:px-8 text-[#F5E6C4] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#D4AF37]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#D4AF37]/5 blur-3xl pointer-events-none" />

      {/* Top Bar with theme and back link */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <ThemeToggle className="border-[#262118] bg-[#121212] text-[#D4AF37]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Institutional Crest */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#121212] border border-[#262118] text-[#D4AF37] shadow-xl">
            <Scale className="h-8 w-8 text-[#D4AF37]" />
          </div>

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#262118] bg-[#121212] px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase text-[#D4AF37]">
            <Lock className="h-3 w-3" />
            JurisFlow Administrator Command
          </span>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            JurisFlow Command Center
          </h2>
          <p className="mt-2 text-xs text-[#A39E93] max-w-sm font-medium">
            Your Legal World, Organized in One Flow.
          </p>
        </div>

        {/* Security Warning Box */}
        <div className="mt-6 rounded-2xl border border-[#262118] bg-[#121212] p-4 text-xs text-[#A39E93]">
          <div className="flex items-start gap-2.5">
            <Server className="h-4 w-4 shrink-0 text-[#D4AF37] mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong className="text-[#F5E6C4]">Security Protocol:</strong> All administrative logins, approvals, and user updates are strictly logged with timestamp and IP origin to the audit database.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-rose-900/60 bg-rose-950/60 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <p className="flex-1">{errorMessage}</p>
          </div>
        )}

        {/* Login Form Card */}
        <div className="mt-6 rounded-3xl border border-[#262118] bg-[#121212] p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#A39E93]">
                Administrator Email / Official ID
              </label>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A39E93]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jurisflow.com"
                  className="w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] py-3 pl-10 pr-3.5 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#A39E93]">
                  Master Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#D4AF37] hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A39E93]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] py-3 pl-10 pr-10 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A39E93] hover:text-[#D4AF37]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-[#D4AF37] py-3.5 text-xs font-black text-[#080808] shadow-lg shadow-[#D4AF37]/15 transition hover:bg-[#AA7C11] disabled:opacity-50"
            >
              {isLoading ? 'Verifying Credentials...' : 'Verify Administrative Access'}
            </button>
          </form>
        </div>

        {/* Portal Switching links */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[#A39E93]">
          <Link to="/login" className="hover:text-[#D4AF37] transition">
            Client Portal →
          </Link>
          <span className="text-[#262118]">•</span>
          <Link to="/" className="hover:text-[#D4AF37] transition">
            Return to Hub
          </Link>
        </div>
      </div>
    </div>
  );
};
