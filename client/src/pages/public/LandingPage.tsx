import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scale,
  Sparkles,
  ShieldCheck,
  Video,
  FileText,
  Users,
  ChevronRight,
  Star,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Building,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { lawyerService } from '../../services/api';
import { LawyerProfile } from '../../types';
import { BookingModal } from '../../components/consultation/BookingModal';

const SPECIALTIES = [
  { name: 'Criminal Lawyer', icon: '🚨', desc: 'Bail, FIR defense, criminal appeals, economic offences' },
  { name: 'Corporate and Commercial Lawyer', icon: '🏢', desc: 'M&A, startup investments, shareholder agreements, VC rounds' },
  { name: 'Contract Lawyer', icon: '📜', desc: 'SaaS agreements, SLA redlining, NDA drafting, commercial deeds' },
  { name: 'Family and Divorce Lawyer', icon: '👨‍👩‍👧', desc: 'Mutual divorce, child custody, maintenance, mediation' },
  { name: 'Property and Real Estate Lawyer', icon: '🏠', desc: '30-year title searches, RERA disputes, sale deed drafting' },
  { name: 'Cybercrime and Technology Lawyer', icon: '💻', desc: 'DPDP compliance, IT Act 66A/66D, cyber financial fraud' },
  { name: 'Tax and GST Lawyer', icon: '💰', desc: 'GST scrutiny, ITAT appeals, transfer pricing & notice replies' },
  { name: 'Intellectual Property Lawyer', icon: '💡', desc: 'Trademark registration, copyright opposition, patent filing' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [topLawyers, setTopLawyers] = useState<LawyerProfile[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<LawyerProfile | null>(null);

  useEffect(() => {
    const loadFeaturedLawyers = async () => {
      try {
        const res = await lawyerService.getLawyers({ limit: 4 });
        if (res.data.success) {
          setTopLawyers(res.data.lawyers);
        }
      } catch (err) {
        console.error('Error fetching featured advocates:', err);
      }
    };
    loadFeaturedLawyers();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white py-16 sm:py-24 dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-bold text-blue-800 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>India's Premier AI Legal Operating System & Advocate Marketplace</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl dark:text-white">
              AI-Powered Contract Intelligence & <br />
              <span className="text-blue-700 dark:text-blue-500">Instant Advocate Consultations</span>
            </h1>

            {/* Sub-headline */}
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
              The complete legal ecosystem. Review and negotiate agreements with instant AI risk scoring (0–100), red-flag
              detection, and e-signatures. Connect with verified Bar Council advocates through encrypted video, audio, or
              chat consultations.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/lawyers"
                className="flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-none"
              >
                <Users className="h-4 w-4" />
                <span>Consult an Advocate (From ₹499)</span>
              </Link>

              <Link
                to="/contracts"
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>AI Contract Lifecycle Hub</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Bar Council Verified Advocates
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Lock className="h-4 w-4 text-blue-600" />
                Client-Attorney Privilege Encrypted
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Rule-Based AI Contract Extraction
              </span>
            </div>
          </div>
        </section>

        {/* Practice Areas / Categories Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Legal Practice Categories
                </span>
                <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl dark:text-white">
                  Find Specialists for Your Legal Problem
                </h2>
              </div>
              <Link to="/lawyers" className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
                <span>View all 15 specialties</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SPECIALTIES.map((spec) => (
                <div
                  key={spec.name}
                  onClick={() => navigate(`/lawyers?specialty=${encodeURIComponent(spec.name)}`)}
                  className="cursor-pointer group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-600"
                >
                  <div>
                    <span className="text-3xl">{spec.icon}</span>
                    <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-400 transition">
                      {spec.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{spec.desc}</p>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-400">
                    <span>Find Advocates</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works (Astrotalk-style smooth flow) */}
        <section className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Seamless 4-Step Journey
            </span>
            <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl dark:text-white">
              Consulting an Advocate is Frictionless on ContractIQ
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left">
              {[
                {
                  step: '01',
                  title: 'Select Practice Specialty',
                  desc: 'Search advocates by Criminal, Corporate, Contract, Family, Property, or Tax law with transparent reviews.',
                },
                {
                  step: '02',
                  title: 'Choose Mode & Duration',
                  desc: 'Pick encrypted Video Call, Audio Call, or Live Chat for 15, 30, or 60 minutes with clear fixed pricing.',
                },
                {
                  step: '03',
                  title: 'Secure Razorpay Checkout',
                  desc: 'Complete payment with instant order generation, UPI, card, or netbanking. Funds held securely in escrow.',
                },
                {
                  step: '04',
                  title: 'Join Encrypted Room',
                  desc: 'Enter your private consultation stage, share documents, receive strategic advice, and get written summaries.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-3xl border border-slate-100 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <span className="font-mono text-2xl font-black text-blue-700 dark:text-blue-400">{item.step}</span>
                  <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Advocates Spotlight */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Featured Legal Counsel
                </span>
                <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl dark:text-white">
                  Consult Top-Rated Advocates
                </h2>
              </div>
              <Link to="/lawyers" className="text-xs font-bold text-blue-700 hover:underline">
                Explore Full Directory →
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {topLawyers.map((lawyer) => (
                <div
                  key={lawyer.id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <img
                        src={
                          lawyer.avatar ||
                          'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
                        }
                        alt={lawyer.full_name}
                        className="h-14 w-14 rounded-2xl object-cover ring-2 ring-blue-600"
                      />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {lawyer.full_name}
                        </h4>
                        <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 line-clamp-1">
                          {lawyer.primary_specialty}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {Number(lawyer.rating_avg || 4.9).toFixed(1)}
                          </span>
                          <span>({lawyer.total_consultations || 20})</span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{lawyer.headline}</p>

                    <p className="mt-2 text-[10px] font-semibold text-slate-400">
                      {lawyer.experience_years} Years Experience • {lawyer.city}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Fee from</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        ₹{lawyer.consultation_fee_15 || 499}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedLawyer(lawyer)}
                      className="rounded-xl bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Regulatory Disclaimer Banner */}
        <section className="bg-slate-100 py-6 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-4xl mx-auto">
              <strong>STATUTORY & ETHICAL DISCLAIMER:</strong> ContractIQ is an independent legal technology and contract
              lifecycle management platform. The advocates listed on this platform are independent legal practitioners
              registered with their respective State Bar Councils. In accordance with the Advocates Act, 1961 and the Bar
              Council of India Rules, this platform does not solicit legal work, advertise, or promote legal services. The
              platform merely facilitates technological connectivity and contract management infrastructure. AI-generated
              analyses are informational tools and do not constitute authoritative legal advice.
            </p>
          </div>
        </section>
      </main>

      <Footer />

      {/* Booking Modal */}
      {selectedLawyer && (
        <BookingModal
          lawyer={selectedLawyer}
          isOpen={!!selectedLawyer}
          onClose={() => setSelectedLawyer(null)}
        />
      )}
    </div>
  );
};
