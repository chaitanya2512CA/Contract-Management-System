import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Shield, Sparkles, FileText, Briefcase, Users } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#262118] bg-[#080808] py-12 text-[#F5E6C4]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#121212] border border-[#262118] text-[#D4AF37] shadow-sm">
                <Scale className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <span className="text-lg font-black tracking-tight text-[#D4AF37]">
                JurisFlow
              </span>
            </div>
            <p className="text-xs font-semibold text-[#F5E6C4]">
              Your Legal World, Organized in One Flow.
            </p>
            <p className="text-xs text-[#A39E93] leading-relaxed">
              The AI-powered legal ecosystem for seamless contract lifecycle management, automated risk redlining, and verified Bar Council advocate consultations.
            </p>
          </div>

          {/* Legal Solutions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              Legal Solutions
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-[#A39E93]">
              <li>
                <Link to="/lawyers" className="flex items-center gap-1.5 transition hover:text-[#D4AF37]">
                  <Users className="h-3.5 w-3.5 text-[#D4AF37]" />
                  Find Advocates
                </Link>
              </li>
              <li>
                <Link to="/contracts" className="flex items-center gap-1.5 transition hover:text-[#D4AF37]">
                  <FileText className="h-3.5 w-3.5 text-[#D4AF37]" />
                  AI Contract Intelligence
                </Link>
              </li>
              <li>
                <Link to="/cases" className="flex items-center gap-1.5 transition hover:text-[#D4AF37]">
                  <Briefcase className="h-3.5 w-3.5 text-[#D4AF37]" />
                  Case Management Hub
                </Link>
              </li>
              <li>
                <Link to="/services" className="flex items-center gap-1.5 transition hover:text-[#D4AF37]">
                  <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                  Fixed-Fee Legal Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              Portals & Access
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-[#A39E93]">
              <li>
                <Link to="/client/dashboard" className="transition hover:text-[#D4AF37]">
                  Client Portal
                </Link>
              </li>
              <li>
                <Link to="/lawyer/dashboard" className="transition hover:text-[#D4AF37]">
                  Advocate Studio
                </Link>
              </li>
              <li>
                <Link to="/business/dashboard" className="transition hover:text-[#D4AF37]">
                  Enterprise Workspace
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="flex items-center gap-1 text-[#D4AF37] hover:underline">
                  <Shield className="h-3.5 w-3.5" />
                  Administration Command
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Regulatory Note */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              Compliance & Ethics
            </h4>
            <p className="mt-3 text-xs text-[#A39E93] leading-relaxed">
              JurisFlow operates in strict compliance with the Advocates Act, 1961. We provide secure technological infrastructure and do not solicit legal representation or practice law.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-[#A39E93]">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span>Bar Council of India Ethics Compliant</span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[#262118] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A39E93] gap-4">
          <p>© {new Date().getFullYear()} JurisFlow Legal Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#D4AF37] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#D4AF37] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#D4AF37] cursor-pointer">Security & Encryption</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
