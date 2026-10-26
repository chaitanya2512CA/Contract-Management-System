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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Optional Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 shadow-md shadow-blue-200 dark:bg-blue-600 dark:shadow-none">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">ContractIQ</span>
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  LEGAL TECH
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                AI CLM & Advocate Marketplace
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex lg:gap-2">
          <Link
            to="/lawyers"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          >
            <Users className="h-4 w-4 text-blue-600" />
            Find Advocates
          </Link>

          <Link
            to="/contracts"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          >
            <FileText className="h-4 w-4 text-emerald-600" />
            AI Contracts
          </Link>

          <Link
            to="/cases"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          >
            <Briefcase className="h-4 w-4 text-amber-600" />
            Legal Cases
          </Link>

          <Link
            to="/services"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          >
            <Sparkles className="h-4 w-4 text-purple-600" />
            Legal Services
          </Link>
        </nav>

        {/* Right: Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowDemoSwitcher(!showDemoSwitcher)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline">Switch Persona</span>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>

            {showDemoSwitcher && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-2 border-b border-slate-100 px-3 py-1.5 dark:border-slate-700">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    One-Click Persona Switcher
                  </p>
                  <p className="text-[11px] text-slate-400">Instantly switch between real ContractIQ roles</p>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleDemoSwitch('client@contractiq.com', 'Client@12345', '/client/dashboard')}
                    className="flex w-full items-center justify-between rounded-xl p-2 text-left text-xs hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Rahul Sharma</p>
                      <p className="text-[10px] text-slate-500">Individual Client Portal</p>
                    </div>
                    <Badge variant="info">Client</Badge>
                  </button>

                  <button
                    onClick={() => handleDemoSwitch('criminal.law@contractiq.com', 'Lawyer@12345', '/lawyer/dashboard')}
                    className="flex w-full items-center justify-between rounded-xl p-2 text-left text-xs hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Adv. Vikramaditya</p>
                      <p className="text-[10px] text-slate-500">Criminal Defense Specialist</p>
                    </div>
                    <Badge variant="warning">Criminal</Badge>
                  </button>

                  <button
                    onClick={() => handleDemoSwitch('contract.law@contractiq.com', 'Lawyer@12345', '/lawyer/dashboard')}
                    className="flex w-full items-center justify-between rounded-xl p-2 text-left text-xs hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Adv. Siddharth</p>
                      <p className="text-[10px] text-slate-500">CLM & Contracts Specialist</p>
                    </div>
                    <Badge variant="success">Contract</Badge>
                  </button>

                  <button
                    onClick={() => handleDemoSwitch('family.law@contractiq.com', 'Lawyer@12345', '/lawyer/dashboard')}
                    className="flex w-full items-center justify-between rounded-xl p-2 text-left text-xs hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Adv. Meenakshi</p>
                      <p className="text-[10px] text-slate-500">Family & Matrimonial</p>
                    </div>
                    <Badge variant="default">Family</Badge>
                  </button>

                  <button
                    onClick={() => handleDemoSwitch('business@contractiq.com', 'Business@12345', '/business/dashboard')}
                    className="flex w-full items-center justify-between rounded-xl p-2 text-left text-xs hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Vikram Singhania</p>
                      <p className="text-[10px] text-slate-500">Enterprise CLM (Apex Dynamics)</p>
                    </div>
                    <Badge variant="purple">Business</Badge>
                  </button>

                  <button
                    onClick={() => handleDemoSwitch('admin@contractiq.com', 'Admin@12345', '/admin/dashboard')}
                    className="flex w-full items-center justify-between rounded-xl p-2 text-left text-xs hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Chief Legal Officer</p>
                      <p className="text-[10px] text-slate-500">Institutional Governance & Verification</p>
                    </div>
                    <Badge variant="danger">Admin</Badge>
                  </button>
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
                className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:w-96">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-500">No new notifications</p>
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
                              ? 'bg-transparent text-slate-600 dark:text-slate-400'
                              : 'bg-blue-50/70 font-medium text-slate-900 dark:bg-slate-700/60 dark:text-white'
                          }`}
                        >
                          <p className="text-xs font-semibold">{n.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{n.message}</p>
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
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <img
                  src={
                    user.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
                  }
                  alt={user.name}
                  className="h-8 w-8 rounded-lg object-cover ring-2 ring-blue-600"
                />
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] capitalize text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                    {role === 'lawyer' ? 'Advocate' : role}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                  <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="mt-1.5 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 capitalize dark:bg-blue-900/40 dark:text-blue-300">
                      {role === 'lawyer' ? 'Advocate Portal' : role === 'business' ? 'Enterprise CLM' : `${role} Portal`}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      Dashboard
                    </Link>

                    {role === 'lawyer' && (
                      <Link
                        to="/lawyer/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <UserIcon className="h-4 w-4 text-indigo-600" />
                        Advocate Profile & Fees
                      </Link>
                    )}

                    <Link
                      to="/contracts"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <FileText className="h-4 w-4 text-emerald-600" />
                      Contracts
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1 dark:border-slate-700">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
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
                className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-slate-600 md:hidden dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900 space-y-2">
          <Link
            to="/lawyers"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Find Advocates
          </Link>
          <Link
            to="/contracts"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            AI Contracts
          </Link>
          <Link
            to="/cases"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Legal Cases
          </Link>
          <Link
            to="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Legal Services
          </Link>
          {isAuthenticated && (
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-bold text-blue-700 dark:text-blue-400"
            >
              My Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
