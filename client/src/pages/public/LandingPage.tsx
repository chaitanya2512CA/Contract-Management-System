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
  MessageSquare,
  Phone,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { lawyerService } from '../../services/api';
import { LawyerProfile } from '../../types';
import { AstrotalkPreConsultationModal } from '../../components/consultation/AstrotalkPreConsultationModal';

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
  const [consultationMode, setConsultationMode] = useState<'chat' | 'call'>('chat');

  useEffect(() => {
    const loadFeaturedLawyers = async () => {
      try {
        const res = await lawyerService.getLawyers({ limit: 4 });
        if (res.data.success) {
          const mockNames = [
            'Adv. Vikramaditya Deshmukh',
            'Adv. Ananya Roy',
            'Adv. Siddharth Malhotra',
            'Adv. Meenakshi Sundaram',
            'Adv. Rajeshwar Verma',
            'Adv. Rohan Menon',
            'Adv. Harish Chawla',
            'Adv. Neha Kapoor',
          ];
          const genuineLawyers = (res.data.lawyers || []).filter(
            (l: LawyerProfile) =>
              !mockNames.includes(l.full_name) &&
              !l.email?.includes('.law@')
          );
          setTopLawyers(genuineLawyers);
        }
      } catch (err) {
        console.error('Error fetching featured advocates:', err);
      }
    };
    loadFeaturedLawyers();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#F5E6C4]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-[#262118] bg-[#080808] py-20 sm:py-28">
          <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#D4AF37]/5 blur-[120px] pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#262118] bg-[#121212] px-4 py-1.5 text-xs font-bold text-[#D4AF37] shadow-sm">
              <Scale className="h-4 w-4 text-[#D4AF37]" />
              <span>JurisFlow • Executive Legal Architecture</span>
            </div>

            {/* Slogan & Main Headline */}
            <h1 className="mt-8 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Your Legal World, <br />
              <span className="text-[#D4AF37]">Organized in One Flow.</span>
            </h1>

            {/* Sub-headline */}
            <p className="mx-auto mt-6 max-w-3xl text-sm leading-relaxed text-[#A39E93] sm:text-base">
              AI-Powered Contract Intelligence & Verified Bar Council Advocate Consultations. Review and negotiate agreements with instant AI risk scoring (0–100), red-flag detection, and e-signatures in a unified workspace.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/lawyers"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-8 py-4 text-sm font-extrabold text-[#080808] shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#AA7C11] active:scale-95"
              >
                <Users className="h-4 w-4" />
                <span>Consult an Advocate (From ₹499)</span>
              </Link>

              <Link
                to="/contracts"
                className="flex items-center justify-center gap-2 rounded-2xl border border-[#262118] bg-[#121212] px-8 py-4 text-sm font-bold text-[#F5E6C4] shadow-sm transition hover:bg-[#1A1A1A] hover:border-[#D4AF37] active:scale-95"
              >
                <FileText className="h-4 w-4 text-[#D4AF37]" />
                <span>AI Contract Lifecycle Hub</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-[#A39E93]">
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                Bar Council Verified Advocates
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Lock className="h-4 w-4 text-[#D4AF37]" />
                Client-Attorney Privilege Encrypted
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                Rule-Based AI Contract Extraction
              </span>
            </div>
          </div>
        </section>

        {/* Practice Areas / Categories Grid */}
        <section className="py-20 bg-[#080808]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  Legal Practice Categories
                </span>
                <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                  Find Specialists for Your Legal Problem
                </h2>
              </div>
              <Link to="/lawyers" className="flex items-center gap-1 text-xs font-bold text-[#D4AF37] hover:underline">
                <span>View all 15 specialties</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SPECIALTIES.map((spec) => (
                <div
                  key={spec.name}
                  onClick={() => navigate(`/lawyers?specialty=${encodeURIComponent(spec.name)}`)}
                  className="cursor-pointer group flex flex-col justify-between rounded-3xl border border-[#262118] bg-[#121212] p-6 shadow-sm transition hover:border-[#D4AF37] hover:bg-[#1A1A1A]"
                >
                  <div>
                    <span className="text-3xl">{spec.icon}</span>
                    <h3 className="mt-3 text-sm font-bold text-white group-hover:text-[#D4AF37] transition">
                      {spec.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#A39E93] line-clamp-2 leading-relaxed">{spec.desc}</p>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-[#D4AF37]">
                    <span>Find Advocates</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works (Astrotalk-style smooth flow) */}
        <section className="border-y border-[#262118] bg-[#0D0D0D] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              Seamless 4-Step Journey
            </span>
            <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
              Consulting an Advocate is Frictionless on JurisFlow
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
                  className="rounded-3xl border border-[#262118] bg-[#121212] p-6"
                >
                  <span className="font-mono text-2xl font-black text-[#D4AF37]">{item.step}</span>
                  <h4 className="mt-2 text-sm font-bold text-white">{item.title}</h4>
                  <p className="mt-1 text-xs text-[#A39E93] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Advocates Spotlight */}
        <section className="py-20 bg-[#080808]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  Featured Legal Counsel
                </span>
                <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                  Consult Top-Rated Advocates
                </h2>
              </div>
              <Link to="/lawyers" className="text-xs font-bold text-[#D4AF37] hover:underline">
                Explore Full Directory →
              </Link>
            </div>

            {topLawyers.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-[#262118] bg-[#121212] p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A1A1A] border border-[#262118] text-[#D4AF37]">
                  <Scale className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">
                  No advocates registered yet. Be the first to join JurisFlow!
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs text-[#A39E93]">
                  Connect with verified clients seeking legal counsel across 15 practice specialties.
                </p>
                <div className="mt-5">
                  <Link
                    to="/register?role=lawyer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#D4AF37] px-6 py-3 text-xs font-bold text-[#080808] shadow-md transition hover:bg-[#AA7C11]"
                  >
                    <span>Register as an Advocate</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {topLawyers.map((lawyer) => {
                  const fee15 = Number(lawyer.consultation_fee_15 || 499);
                  const perMinute = Math.max(15, Math.round(fee15 / 15));
                  const ratingAvg = (Number(lawyer.rating_avg) || 4.9).toFixed(1);

                  return (
                    <div
                      key={lawyer.id}
                      className="group flex flex-col justify-between rounded-3xl border border-[#262118] bg-[#121212] p-5 shadow-sm transition hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#D4AF37]/5"
                    >
                      <div>
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={
                                lawyer.avatar ||
                                'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
                              }
                              alt={lawyer.full_name}
                              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-[#D4AF37]/70 shadow-sm"
                            />
                            {/* Live status dot */}
                            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#10B981] ring-2 ring-[#121212]">
                              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-[#D4AF37] transition">
                                {lawyer.full_name}
                              </h4>
                              {/* Astrotalk Online Status Badge */}
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#10B981] ring-1 ring-[#10B981]/30 shrink-0">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75"></span>
                                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>
                                </span>
                                Online
                              </span>
                            </div>

                            <p className="text-[11px] font-semibold text-[#D4AF37] truncate mt-0.5">
                              {lawyer.primary_specialty}
                            </p>
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-[#A39E93]">
                              <Star className="h-3 w-3 fill-[#D4AF37] text-[#D4AF37]" />
                              <span className="font-bold text-[#F5E6C4]">
                                ★ {ratingAvg}
                              </span>
                              <span>({lawyer.total_consultations || 24})</span>
                            </div>
                          </div>
                        </div>

                        <p className="mt-3 line-clamp-2 text-xs text-[#A39E93] leading-relaxed">
                          {lawyer.headline || lawyer.bio}
                        </p>

                        <p className="mt-2 text-[10px] font-semibold text-[#A39E93]/80">
                          {lawyer.experience_years} Years Experience • {lawyer.city}
                        </p>
                      </div>

                      {/* Bottom: Pricing & Dual Action Buttons */}
                      <div className="mt-4 border-t border-[#262118] pt-3 flex items-center justify-between gap-2">
                        <div>
                          <span className="inline-flex items-center rounded-md bg-[#1A1A1A] border border-[#262118] px-2 py-0.5 text-[10px] font-black text-[#D4AF37]">
                            ⚡ ₹{perMinute}/min
                          </span>
                          <p className="text-[9px] text-[#A39E93] mt-0.5">₹{fee15} / 15m</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* 💬 Chat button */}
                          <button
                            onClick={() => {
                              setSelectedLawyer(lawyer);
                              setConsultationMode('chat');
                            }}
                            className="flex items-center gap-1 rounded-xl border border-[#D4AF37]/50 bg-[#1A1A1A] px-2.5 py-1.5 text-[11px] font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#080808] active:scale-95"
                            title="Instant Chat Consultation"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Chat</span>
                          </button>

                          {/* 📞 Call button */}
                          <button
                            onClick={() => {
                              setSelectedLawyer(lawyer);
                              setConsultationMode('call');
                            }}
                            className="flex items-center gap-1 rounded-xl bg-[#D4AF37] px-2.5 py-1.5 text-[11px] font-extrabold text-[#080808] transition hover:bg-[#AA7C11] active:scale-95"
                            title="Instant Call Consultation"
                          >
                            <Phone className="h-3 w-3" />
                            <span>Call</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Regulatory Disclaimer Banner */}
        <section className="bg-[#121212] py-8 border-t border-[#262118]">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-[11px] text-[#A39E93] leading-relaxed max-w-4xl mx-auto">
              <strong className="text-[#F5E6C4]">STATUTORY & ETHICAL DISCLAIMER:</strong> JurisFlow is an independent legal technology and contract
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

      {/* Astrotalk Instant Pre-Consultation Modal */}
      {selectedLawyer && (
        <AstrotalkPreConsultationModal
          key={`${selectedLawyer.id}-${consultationMode}`}
          lawyer={selectedLawyer}
          initialMode={consultationMode}
          isOpen={!!selectedLawyer}
          onClose={() => setSelectedLawyer(null)}
        />
      )}
    </div>
  );
};
