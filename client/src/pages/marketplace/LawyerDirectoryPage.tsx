import React, { useState, useEffect } from 'react';
import {
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
import { BookingModal } from '../../components/consultation/BookingModal';
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
        setLawyers(res.data.lawyers);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Header */}
      <div className="border-b border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
              Verified Advocate Consultation Marketplace
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Consult Top Advocates in India Online
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
              Connect with verified legal experts across 15 practice areas via secure instant audio, video, or chat.
              Fixed transparent pricing with complete client-attorney privilege.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by advocate name, legal issue, city, or practice area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="fee_asc">Fee: Low to High</option>
                <option value="fee_desc">Fee: High to Low</option>
              </select>

              <button
                type="submit"
                className="rounded-2xl bg-blue-700 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>

          {/* Specialty Filter Carousel Pills */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SPECIALTIES.map((spec) => (
              <button
                key={spec.id}
                onClick={() => setSelectedSpecialty(spec.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  selectedSpecialty === spec.id
                    ? 'bg-blue-700 text-white shadow-sm dark:bg-blue-600'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Badges & Count */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Showing</span>
            <span className="font-bold text-slate-900 dark:text-white">{lawyers.length} Advocates</span>
            {selectedSpecialty !== 'all' && (
              <span className="rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                {selectedSpecialty}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Verified Advocates Only</span>
            </label>

            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={() => setSelectedMode('')}
                className={`rounded-lg px-2.5 py-1 ${!selectedMode ? 'bg-slate-900 text-white dark:bg-slate-700' : 'text-slate-600'}`}
              >
                All Modes
              </button>
              <button
                onClick={() => setSelectedMode('video')}
                className={`rounded-lg px-2.5 py-1 ${selectedMode === 'video' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'text-slate-600'}`}
              >
                Video
              </button>
              <button
                onClick={() => setSelectedMode('chat')}
                className={`rounded-lg px-2.5 py-1 ${selectedMode === 'chat' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'text-slate-600'}`}
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
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : lawyers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-slate-800">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No advocates matched your criteria</h3>
            <p className="mt-1 text-xs text-slate-500">Try clearing filters or selecting another practice specialty.</p>
            <button
              onClick={() => {
                setSelectedSpecialty('all');
                setSearchQuery('');
                setSelectedMode('');
                setVerifiedOnly(false);
              }}
              className="mt-4 rounded-xl bg-blue-700 px-4 py-2 text-xs font-semibold text-white"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-600"
              >
                <div>
                  {/* Top: Avatar, Name, Verified Badge, Rating */}
                  <div className="flex items-start gap-3.5">
                    <div className="relative">
                      <img
                        src={
                          lawyer.avatar ||
                          'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
                        }
                        alt={lawyer.full_name}
                        className="h-16 w-16 rounded-2xl object-cover ring-2 ring-blue-600 shadow-sm"
                      />
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition">
                            {lawyer.full_name}
                          </h3>
                        </div>
                        {lawyer.is_verified && (
                          <span
                            title="Bar Council Verified Advocate"
                            className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                        {lawyer.primary_specialty}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-0.5 font-bold text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          {Number(lawyer.rating_avg || 4.9).toFixed(1)}
                        </span>
                        <span>•</span>
                        <span>{lawyer.total_consultations || 24} consultations</span>
                      </div>
                    </div>
                  </div>

                  {/* Headline & Credentials */}
                  <p className="mt-3 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                    {lawyer.headline || lawyer.bio}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      {lawyer.experience_years} Years Exp.
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {lawyer.city}, {lawyer.state}
                    </span>
                  </div>

                  {/* Languages Spoken */}
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {(Array.isArray(lawyer.languages) ? lawyer.languages : ['English', 'Hindi']).map((lang) => (
                      <span
                        key={lang}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom: Pricing & Consultation CTA */}
                <div className="mt-5 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Consultation Starts At</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          ₹{lawyer.consultation_fee_15 || 499}
                        </span>
                        <span className="text-[10px] text-slate-500">/ 15 min</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedLawyerForBooking(lawyer)}
                      className="flex items-center gap-1.5 rounded-2xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-none"
                    >
                      <span>Consult Now</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Astrotalk Booking Modal */}
      {selectedLawyerForBooking && (
        <BookingModal
          lawyer={selectedLawyerForBooking}
          isOpen={!!selectedLawyerForBooking}
          onClose={() => setSelectedLawyerForBooking(null)}
        />
      )}
    </div>
  );
};
