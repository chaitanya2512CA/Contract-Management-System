import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scale,
  Bell,
  Shield,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  FileText,
  Briefcase,
  Users,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { Badge } from '../common/Badge';

export const Navbar: React.FC<{ toggleSidebar?: () => void }> = ({ toggleSidebar }) => {
  const { user, role, isAuthenticated, logout, login } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'lawyer') return '/lawyer/dashboard';
    if (role === 'business') return '/business/dashboard';
    if (role === 'organizer') return '/organizer/dashboard';
    if (role === 'student') return '/student/dashboard';
    return '/client/dashboard';
  };

  const handleDemoSwitch = async (email: string, pass: string, targetPath: string) => {
    try {
      setShowDemoSwitcher(false);
      await login({ email, password: pass });
      navigate(targetPath);
    } catch (err) {
      console.error('Demo switch failed:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#262118] bg-[#080808]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Optional Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="rounded-xl p-2 text-[#A39E93] hover:bg-[#121212] hover:text-[#D4AF37] md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#121212] border border-[#262118] text-[#D4AF37] shadow-sm transition group-hover:border-[#D4AF37]">
              <Scale className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-[#D4AF37] group-hover:text-[#F5E6C4] transition">
                  JurisFlow
                </span>
                <span className="rounded bg-[#1A1A1A] border border-[#262118] px-1.5 py-0.5 text-[9px] font-bold text-[#D4AF37]">
                  LEGAL TECH
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#A39E93]">
                Your Legal World, Organized in One Flow.
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex lg:gap-2">
          <Link
            to="/lawyers"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#A39E93] transition hover:bg-[#121212] hover:text-[#D4AF37]"
          >
            <Users className="h-4 w-4 text-[#D4AF37]" />
            Find Advocates
          </Link>

          <Link
            to="/contracts"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#A39E93] transition hover:bg-[#121212] hover:text-[#D4AF37]"
          >
            <FileText className="h-4 w-4 text-[#D4AF37]" />
            AI Contracts
          </Link>

          <Link
            to="/cases"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#A39E93] transition hover:bg-[#121212] hover:text-[#D4AF37]"
          >
            <Briefcase className="h-4 w-4 text-[#D4AF37]" />
            Legal Cases
          </Link>

          <Link
            to="/services"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#A39E93] transition hover:bg-[#121212] hover:text-[#D4AF37]"
          >
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
            Legal Services
          </Link>
        </nav>

        {/* Right: Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowDemoSwitcher(!showDemoSwitcher)}
              className="flex items-center gap-1.5 rounded-xl border border-[#262118] bg-[#121212] px-3 py-1.5 text-xs font-semibold text-[#F5E6C4] shadow-sm transition hover:bg-[#1A1A1A] hover:border-[#D4AF37]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Switch Persona</span>
              <ChevronDown className="h-3 w-3 text-[#A39E93]" />
            </button>

            {showDemoSwitcher && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#262118] bg-[#121212] p-2 shadow-2xl">
                <div className="mb-2 border-b border-[#262118] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    One-Click Persona Switcher
                  </p>
                  <p className="text-[11px] text-[#A39E93]">Instantly switch between real JurisFlow roles</p>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleDemoSwitch('client@jurisflow.com', 'Client@12345', '/client/dashboard')}
                    className="flex w-full items-center justify-between rounded-xl p-2 text-left text-xs text-[#F5E6C4] transition hover:bg-[#1A1A1A]"
                  >
                    <div>
                      <p className="font-semibold text-white">Rahul Sharma</p>
                      <p className="text-[10px] text-[#A39E93]">Individual Client Portal</p>
                    </div>
                    <span className="rounded bg-[#1A1A1A] border border-[#262118] px-2 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                      Client
                    </span>
                  </button>

                  <button
                    onClick={() => handleDemoSwitch('business@jurisflow.com', 'Business@12345', '/business/dashboard')}
                    className="flex w-full items-center justify-between rounded-xl p-2 text-left text-xs text-[#F5E6C4] transition hover:bg-[#1A1A1A]"
                  >
                    <div>
                      <p className="font-semibold text-white">Vikram Singhania</p>
                      <p className="text-[10px] text-[#A39E93]">Enterprise CLM (Apex Dynamics)</p>
                    </div>
                    <span className="rounded bg-[#1A1A1A] border border-[#262118] px-2 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                      Business
                    </span>
                  </button>

                  <button
                    onClick={() => handleDemoSwitch('admin@jurisflow.com', 'Admin@12345', '/admin/dashboard')}
                    className="flex w-full items-center justify-between rounded-xl p-2 text-left text-xs text-[#F5E6C4] transition hover:bg-[#1A1A1A]"
                  >
                    <div>
                      <p className="font-semibold text-white">Chief Legal Officer</p>
                      <p className="text-[10px] text-[#A39E93]">Platform Super Admin</p>
                    </div>
                    <span className="rounded bg-[#1A1A1A] border border-[#262118] px-2 py-0.5 text-[10px] font-bold text-rose-400">
                      Admin
                    </span>
                  </button>

                  <div className="pt-1.5 border-t border-[#262118]">
                    <Link
                      to="/register?role=lawyer"
                      onClick={() => setShowDemoSwitcher(false)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#1A1A1A] py-2 text-center text-xs font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#080808]"
                    >
                      <Scale className="h-3.5 w-3.5" />
                      <span>Register as an Advocate</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />

          {/* Notifications Drawer */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-xl p-2 text-[#A39E93] transition hover:bg-[#121212] hover:text-[#D4AF37]"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#262118] bg-[#121212] p-3 shadow-2xl sm:w-96">
                  <div className="flex items-center justify-between border-b border-[#262118] pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-medium text-[#A39E93] hover:text-[#D4AF37] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-[#A39E93]">No new notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id || n.id}
                          onClick={() => {
                            markAsRead(n._id || n.id || '');
                            if (n.link) navigate(n.link);
                            setShowNotifications(false);
                          }}
                          className={`cursor-pointer rounded-xl p-2.5 transition ${
                            n.isRead
                              ? 'bg-transparent text-[#A39E93]'
                              : 'bg-[#1A1A1A] font-medium text-[#F5E6C4] border border-[#262118]'
                          }`}
                        >
                          <p className="text-xs font-semibold text-white">{n.title}</p>
                          <p className="mt-0.5 text-[11px] text-[#A39E93]">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile or Login */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-[#121212]"
              >
                <img
                  src={
                    user.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
                  }
                  alt={user.name}
                  className="h-8 w-8 rounded-lg object-cover ring-2 ring-[#D4AF37]"
                />
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold text-[#F5E6C4] leading-tight">{user.name}</p>
                  <p className="text-[10px] capitalize text-[#A39E93] leading-none mt-0.5">
                    {role === 'lawyer' ? 'Advocate' : role}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[#A39E93]" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#262118] bg-[#121212] p-2 shadow-2xl">
                  <div className="border-b border-[#262118] px-3 py-2">
                    <p className="text-xs font-bold text-white">{user.name}</p>
                    <p className="text-[11px] text-[#A39E93] truncate">{user.email}</p>
                    <span className="mt-1.5 inline-block rounded bg-[#1A1A1A] border border-[#262118] px-1.5 py-0.5 text-[10px] font-semibold text-[#D4AF37] capitalize">
                      {role === 'lawyer' ? 'Advocate Portal' : role === 'business' ? 'Enterprise CLM' : `${role} Portal`}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#F5E6C4] transition hover:bg-[#1A1A1A] hover:text-[#D4AF37]"
                    >
                      <Briefcase className="h-4 w-4 text-[#D4AF37]" />
                      Dashboard
                    </Link>

                    {role === 'lawyer' && (
                      <Link
                        to="/lawyer/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#F5E6C4] transition hover:bg-[#1A1A1A] hover:text-[#D4AF37]"
                      >
                        <UserIcon className="h-4 w-4 text-[#D4AF37]" />
                        Advocate Profile & Fees
                      </Link>
                    )}

                    <Link
                      to="/contracts"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#F5E6C4] transition hover:bg-[#1A1A1A] hover:text-[#D4AF37]"
                    >
                      <FileText className="h-4 w-4 text-[#D4AF37]" />
                      Contracts
                    </Link>
                  </div>

                  <div className="border-t border-[#262118] pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-950/30"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl px-3.5 py-2 text-xs font-semibold text-[#F5E6C4] transition hover:bg-[#121212] hover:text-[#D4AF37]"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#080808] shadow-sm transition hover:bg-[#AA7C11]"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-[#A39E93] md:hidden hover:text-[#D4AF37]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-[#262118] bg-[#080808] px-4 py-3 md:hidden space-y-2">
          <Link
            to="/lawyers"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-[#F5E6C4] hover:bg-[#121212] hover:text-[#D4AF37]"
          >
            Find Advocates
          </Link>
          <Link
            to="/contracts"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-[#F5E6C4] hover:bg-[#121212] hover:text-[#D4AF37]"
          >
            AI Contracts
          </Link>
          <Link
            to="/cases"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-[#F5E6C4] hover:bg-[#121212] hover:text-[#D4AF37]"
          >
            Legal Cases
          </Link>
          <Link
            to="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-[#F5E6C4] hover:bg-[#121212] hover:text-[#D4AF37]"
          >
            Legal Services
          </Link>
          {isAuthenticated && (
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-bold text-[#D4AF37]"
            >
              My Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
