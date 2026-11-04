import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Search,
  Filter,
  ShieldCheck,
  Star,
  Video,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  Briefcase,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { LawyerProfile, LawyerSpecialty } from '../../types';
import { lawyerService } from '../../services/api';
import { AstrotalkPreConsultationModal } from '../../components/consultation/AstrotalkPreConsultationModal';
import { Badge } from '../../components/common/Badge';

const SPECIALTIES: Array<{ id: string; label: string; icon: string }> = [
  { id: 'all', label: 'All Specialties', icon: '⚖️' },
  { id: 'Criminal Lawyer', label: 'Criminal Defense', icon: '🚨' },
  { id: 'Corporate and Commercial Lawyer', label: 'Corporate & M&A', icon: '🏢' },
  { id: 'Contract Lawyer', label: 'Contracts & CLM', icon: '📜' },
  { id: 'Family and Divorce Lawyer', label: 'Family & Divorce', icon: '👨‍👩‍👧' },
  { id: 'Property and Real Estate Lawyer', label: 'Property & Land', icon: '🏠' },
  { id: 'Cybercrime and Technology Lawyer', label: 'Cyber & DPDP', icon: '💻' },
  { id: 'Tax and GST Lawyer', label: 'Tax & GST', icon: '💰' },
  { id: 'Intellectual Property Lawyer', label: 'IP & Patents', icon: '💡' },
  { id: 'Civil Litigation Lawyer', label: 'Civil Litigation', icon: '🏛️' },
  { id: 'Employment and Labour Lawyer', label: 'Employment Law', icon: '👔' },
  { id: 'Banking and Financial Lawyer', label: 'Banking & Finance', icon: '💳' },
  { id: 'Immigration Lawyer', label: 'Immigration', icon: '✈️' },
];

export const LawyerDirectoryPage: React.FC = () => {
  const [lawyers, setLawyers] = useState<LawyerProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [selectedLawyerForBooking, setSelectedLawyerForBooking] = useState<LawyerProfile | null>(null);
  const [consultationMode, setConsultationMode] = useState<'chat' | 'call'>('chat');

  const fetchLawyers = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        specialty: selectedSpecialty !== 'all' ? selectedSpecialty : undefined,
        search: searchQuery || undefined,
        mode: selectedMode || undefined,
        verified: verifiedOnly ? 'true' : undefined,
        sortBy,
      };
      const res = await lawyerService.getLawyers(params);
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
        setLawyers(genuineLawyers);
      }
    } catch (err) {
      console.error('Failed to fetch advocates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyers();
  }, [selectedSpecialty, selectedMode, verifiedOnly, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLawyers();
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5E6C4]">
      {/* Hero Header */}
      <div className="border-b border-[#262118] bg-[#0D0D0D] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#262118] bg-[#121212] px-3.5 py-1 text-xs font-bold text-[#D4AF37]">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              Verified Advocate Marketplace
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Consult Top Advocates in India Online
            </h1>
            <p className="mt-3 text-sm text-[#A39E93] leading-relaxed sm:text-base">
              Connect with verified legal counsel across 15 practice areas via secure instant audio, video, or chat.
              Fixed transparent pricing with complete client-attorney privilege.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#A39E93]" />
              <input
                type="text"
                placeholder="Search by advocate name, legal issue, city, or practice area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-[#262118] bg-[#121212] py-3.5 pl-11 pr-4 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:bg-[#1A1A1A] focus:outline-none transition"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-2xl border border-[#262118] bg-[#121212] px-4 py-3.5 text-xs font-semibold text-[#F5E6C4] focus:border-[#D4AF37] focus:outline-none transition"
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="fee_asc">Fee: Low to High</option>
                <option value="fee_desc">Fee: High to Low</option>
              </select>

              <button
                type="submit"
                className="rounded-2xl bg-[#D4AF37] px-7 py-3.5 text-xs font-extrabold text-[#080808] shadow-md transition hover:bg-[#AA7C11]"
              >
                Search
              </button>
            </div>
          </form>

          {/* Specialty Filter Carousel Pills */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SPECIALTIES.map((spec) => (
              <button
                key={spec.id}
                onClick={() => setSelectedSpecialty(spec.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                  selectedSpecialty === spec.id
                    ? 'bg-[#D4AF37] text-[#080808] shadow-sm'
                    : 'border border-[#262118] bg-[#121212] text-[#F5E6C4] hover:bg-[#1A1A1A] hover:border-[#D4AF37]'
                }`}
              >
                <span>{spec.icon}</span>
                <span>{spec.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content & Directory Grid */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Filter Badges & Count */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#A39E93]">
            <span>Showing</span>
            <span className="font-bold text-white">{lawyers.length} Advocates</span>
            {selectedSpecialty !== 'all' && (
              <span className="rounded-md border border-[#262118] bg-[#1A1A1A] px-2.5 py-0.5 font-bold text-[#D4AF37]">
                {selectedSpecialty}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#F5E6C4]">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-[#262118] bg-[#121212] text-[#D4AF37] focus:ring-[#D4AF37]"
              />
              <span>Verified Advocates Only</span>
            </label>

            <div className="flex items-center rounded-xl border border-[#262118] bg-[#121212] p-1 text-xs">
              <button
                onClick={() => setSelectedMode('')}
                className={`rounded-lg px-3 py-1 font-semibold transition ${
                  !selectedMode ? 'bg-[#D4AF37] text-[#080808]' : 'text-[#A39E93] hover:text-[#F5E6C4]'
                }`}
              >
                All Modes
              </button>
              <button
                onClick={() => setSelectedMode('video')}
                className={`rounded-lg px-3 py-1 font-semibold transition ${
                  selectedMode === 'video' ? 'bg-[#D4AF37] text-[#080808]' : 'text-[#A39E93] hover:text-[#F5E6C4]'
                }`}
              >
                Video
              </button>
              <button
                onClick={() => setSelectedMode('chat')}
                className={`rounded-lg px-3 py-1 font-semibold transition ${
                  selectedMode === 'chat' ? 'bg-[#D4AF37] text-[#080808]' : 'text-[#A39E93] hover:text-[#F5E6C4]'
                }`}
              >
                Chat
              </button>
            </div>
          </div>
        </div>

        {/* Advocates Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl border border-[#262118] bg-[#121212]" />
            ))}
          </div>
        ) : lawyers.length === 0 ? (
          <div className="rounded-3xl border border-[#262118] bg-[#121212] p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#262118] bg-[#1A1A1A] text-[#D4AF37]">
              <Scale className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">
              {searchQuery || selectedSpecialty !== 'all' || selectedMode || verifiedOnly
                ? 'No advocates matched your criteria'
                : 'No advocates registered yet. Be the first to join JurisFlow!'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs text-[#A39E93]">
              {searchQuery || selectedSpecialty !== 'all' || selectedMode || verifiedOnly
                ? 'Try adjusting your search terms or clearing active filters to see all available counsel.'
                : 'Join our elite network of verified Bar Council advocates and start offering legal consultations online.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register?role=lawyer"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#D4AF37] px-6 py-3 text-xs font-bold text-[#080808] shadow-md transition hover:bg-[#AA7C11]"
              >
                <span>Register as an Advocate</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              {(searchQuery || selectedSpecialty !== 'all' || selectedMode || verifiedOnly) && (
                <button
                  onClick={() => {
                    setSelectedSpecialty('all');
                    setSearchQuery('');
                    setSelectedMode('');
                    setVerifiedOnly(false);
                  }}
                  className="rounded-2xl border border-[#262118] bg-[#1A1A1A] px-5 py-3 text-xs font-semibold text-[#F5E6C4] transition hover:border-[#D4AF37]"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lawyers.map((lawyer) => {
              const fee15 = Number(lawyer.consultation_fee_15 || 499);
              const perMinute = Math.max(15, Math.round(fee15 / 15));
              const ratingAvg = (Number(lawyer.rating_avg) || 4.9).toFixed(1);

              return (
                <div
                  key={lawyer.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-[#262118] bg-[#121212] p-6 shadow-sm transition hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#D4AF37]/5"
                >
                  <div>
                    {/* Top: Avatar, Name, Live Status Badge, Verified Badge, Rating */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0">
                        <img
                          src={
                            lawyer.avatar ||
                            'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
                          }
                          alt={lawyer.full_name}
                          className="h-16 w-16 rounded-2xl object-cover ring-2 ring-[#D4AF37]/70 shadow-sm"
                        />
                        {/* Live status dot on avatar */}
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#10B981] ring-2 ring-[#121212]">
                          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <div className="truncate">
                            <h3 className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition truncate">
                              {lawyer.full_name}
                            </h3>
                            <p className="text-xs font-semibold text-[#D4AF37] truncate mt-0.5">
                              {lawyer.primary_specialty}
                            </p>
                          </div>

                          {/* Status Indicator Badge (Astrotalk style) */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-bold text-[#10B981] ring-1 ring-[#10B981]/30">
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]"></span>
                              </span>
                              Online
                            </span>

                            {lawyer.is_verified && (
                              <span
                                title="Bar Council Verified Advocate"
                                className="flex items-center gap-0.5 rounded-full border border-[#D4AF37]/30 bg-[#1A1A1A] px-2 py-0.5 text-[9px] font-bold text-[#D4AF37]"
                              >
                                <ShieldCheck className="h-2.5 w-2.5" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-xs text-[#A39E93]">
                          <span className="flex items-center gap-0.5 font-bold text-[#F5E6C4]">
                            <Star className="h-3.5 w-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                            ★ {ratingAvg}
                          </span>
                          <span>•</span>
                          <span>{lawyer.total_consultations || 24} consultations</span>
                        </div>
                      </div>
                    </div>

                    {/* Headline & Credentials */}
                    <p className="mt-3 line-clamp-2 text-xs text-[#A39E93] leading-relaxed">
                      {lawyer.headline || lawyer.bio}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#A39E93]">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5 text-[#D4AF37]" />
                        {lawyer.experience_years} Years Exp.
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                        {lawyer.city}, {lawyer.state}
                      </span>
                    </div>

                    {/* Languages Spoken */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(Array.isArray(lawyer.languages) ? lawyer.languages : ['English', 'Hindi']).map((lang) => (
                        <span
                          key={lang}
                          className="rounded-md border border-[#262118] bg-[#1A1A1A] px-2 py-0.5 text-[10px] font-medium text-[#A39E93]"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom: Astrotalk Pricing Callout & Dual Action Buttons (Chat & Call) */}
                  <div className="mt-6 border-t border-[#262118] pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center rounded-md border border-[#262118] bg-[#1A1A1A] px-2 py-0.5 text-[11px] font-black text-[#D4AF37]">
                            ⚡ ₹{perMinute}/min
                          </span>
                        </div>
                        <p className="text-[10px] text-[#A39E93] mt-0.5">
                          ₹{fee15} for 15 min session
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Instant Chat Action */}
                        <button
                          onClick={() => {
                            setSelectedLawyerForBooking(lawyer);
                            setConsultationMode('chat');
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#1A1A1A] px-3.5 py-2 text-xs font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#080808] active:scale-95"
                          title="Start Instant Chat Consultation"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Chat</span>
                        </button>

                        {/* Instant Call Action */}
                        <button
                          onClick={() => {
                            setSelectedLawyerForBooking(lawyer);
                            setConsultationMode('call');
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-3.5 py-2 text-xs font-extrabold text-[#080808] shadow-sm transition hover:bg-[#AA7C11] active:scale-95"
                          title="Start Instant Audio / Video Call"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Call</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Astrotalk Instant Consultation Modal */}
      {selectedLawyerForBooking && (
        <AstrotalkPreConsultationModal
          key={`${selectedLawyerForBooking.id}-${consultationMode}`}
          lawyer={selectedLawyerForBooking}
          initialMode={consultationMode}
          isOpen={!!selectedLawyerForBooking}
          onClose={() => setSelectedLawyerForBooking(null)}
        />
      )}
    </div>
  );
};
