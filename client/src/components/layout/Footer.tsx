import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Shield, Sparkles, FileText, Briefcase, Users } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white shadow-md shadow-blue-200 dark:bg-blue-600 dark:shadow-none">
                <Scale className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                JurisFlow
              </span>
            </div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Your Legal World, Organized in One Flow.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The AI-powered legal ecosystem for seamless contract lifecycle management, automated risk redlining, and verified Bar Council advocate consultations.
            </p>
          </div>

          {/* Legal Solutions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Legal Solutions
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/lawyers" className="flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-400">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  Find Advocates
                </Link>
              </li>
              <li>
                <Link to="/contracts" className="flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-400">
                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  AI Contract Intelligence
                </Link>
              </li>
              <li>
                <Link to="/cases" className="flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-400">
                  <Briefcase className="h-3.5 w-3.5 text-amber-600" />
                  Case Management Hub
                </Link>
              </li>
              <li>
                <Link to="/services" className="flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-400">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  Fixed-Fee Legal Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Portals & Access
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/client/dashboard" className="hover:text-blue-700 dark:hover:text-blue-400">
                  Client Portal
                </Link>
              </li>
              <li>
                <Link to="/lawyer/dashboard" className="hover:text-blue-700 dark:hover:text-blue-400">
                  Advocate Studio
                </Link>
              </li>
              <li>
                <Link to="/business/dashboard" className="hover:text-blue-700 dark:hover:text-blue-400">
                  Enterprise Workspace
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="flex items-center gap-1 text-blue-700 dark:text-blue-400 hover:underline">
                  <Shield className="h-3.5 w-3.5" />
                  Administration Command
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Regulatory Note */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Compliance & Ethics
            </h4>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              JurisFlow operates in strict compliance with the Advocates Act, 1961. We provide secure technological infrastructure and do not solicit legal representation or practice law.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>Client-Attorney Privilege Encrypted</span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400 dark:border-slate-800">
          © {new Date().getFullYear()} JurisFlow. Your Legal World, Organized in One Flow. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
