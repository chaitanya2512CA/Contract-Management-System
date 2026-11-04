import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  ChevronRight,
  CreditCard,
  FileText,
  Star,
} from 'lucide-react';
import { legalServicesService, paymentService } from '../../services/api';
import { LegalService } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const LegalServicesPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState<LegalService[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Service Request Modal
  const [selectedService, setSelectedService] = useState<LegalService | null>(null);
  const [requirements, setRequirements] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const res = await legalServicesService.getAll({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: search || undefined,
      });
      if (res.data.success) {
        setServices(res.data.services);
      }
    } catch (err) {
      console.error('Failed to fetch legal services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [selectedCategory]);

  const handleOrderService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=services');
      return;
    }
    if (!selectedService || !requirements.trim()) return;

    try {
      setIsSubmitting(true);
      await legalServicesService.request(selectedService.id, {
        requirements: requirements.trim(),
      });

      alert('Legal service ordered successfully! Your advocate will initiate drafting immediately.');
      setSelectedService(null);
      setRequirements('');
      navigate('/client/dashboard');
    } catch (err) {
      console.error('Failed to order service:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] py-10 text-[#F5E6C4]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner */}
        <div className="rounded-3xl border border-[#262118] bg-[#0D0D0D] p-8 shadow-sm">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#262118] bg-[#121212] px-3.5 py-1 text-xs font-bold text-[#D4AF37]">
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
            Fixed-Price Legal Deliverables
          </div>
          <h1 className="mt-4 text-2xl font-black text-white sm:text-4xl">
            Legal Document Drafting & Review Marketplace
          </h1>
          <p className="mt-2 text-xs text-[#A39E93] max-w-3xl leading-relaxed sm:text-sm">
            Engage verified advocates for standardized contract redlines, customized employment agreements, legal
            demand notices, and title investigations with guaranteed turnaround times.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#262118] bg-[#121212] p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A39E93]" />
            <input
              type="text"
              placeholder="Search services by keyword, drafting type, or notice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchServices()}
              className="w-full rounded-xl border border-[#262118] bg-[#1A1A1A] py-2.5 pl-10 pr-3 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['all', 'Contract Review', 'Corporate Drafting', 'Litigation Notice'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-[#D4AF37] text-[#080808] font-bold shadow-sm'
                    : 'border border-[#262118] bg-[#1A1A1A] text-[#F5E6C4] hover:bg-[#262118] hover:border-[#D4AF37]'
                }`}
              >
                {cat === 'all' ? 'All Services' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-3xl border border-[#262118] bg-[#121212]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="group flex flex-col justify-between rounded-3xl border border-[#262118] bg-[#121212] p-6 shadow-sm transition hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#D4AF37]/5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-[#262118] bg-[#1A1A1A] px-2.5 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                      {svc.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[#A39E93]">
                      <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
                      {svc.estimated_turnaround_days} Days Delivery
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-white leading-snug group-hover:text-[#D4AF37] transition">
                    {svc.title}
                  </h3>

                  <p className="mt-2 text-xs text-[#A39E93] leading-relaxed">{svc.description}</p>

                  {/* Deliverables List */}
                  <div className="mt-4 space-y-1.5 border-t border-[#262118] pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A39E93]">Included Deliverables</p>
                    {(Array.isArray(svc.deliverables) ? svc.deliverables : []).map((d, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-[#F5E6C4]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-[#262118] pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#A39E93]">Fixed Package Price</span>
                    <p className="text-xl font-black text-white">₹{svc.price_amount}</p>
                  </div>

                  <button
                    onClick={() => setSelectedService(svc)}
                    className="flex items-center gap-1.5 rounded-2xl bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#080808] shadow-md transition hover:bg-[#AA7C11]"
                  >
                    <span>Order Now</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Service Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-[#262118] bg-[#121212] p-6 shadow-2xl text-[#F5E6C4]">
            <h3 className="text-base font-black text-white">Order: {selectedService.title}</h3>
            <p className="mt-1 text-xs text-[#A39E93]">
              Fixed Price: ₹{selectedService.price_amount} • Turnaround: {selectedService.estimated_turnaround_days} Days
            </p>

            <form onSubmit={handleOrderService} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#A39E93]">Your Requirements & Case Specifics</label>
                <textarea
                  rows={4}
                  required
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Provide party details, specific clauses to amend, notice facts, or link to contract document..."
                  className="mt-1.5 w-full rounded-2xl border border-[#262118] bg-[#1A1A1A] p-3 text-xs text-[#F5E6C4] placeholder:text-[#A39E93] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="w-1/3 rounded-xl border border-[#262118] bg-[#1A1A1A] py-2.5 text-xs font-semibold text-[#A39E93] hover:text-[#F5E6C4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-[#080808] hover:bg-[#AA7C11] disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Confirming Order...' : `Pay ₹{selectedService.price_amount} & Order`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
