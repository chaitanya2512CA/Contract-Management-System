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
      const reqRes = await legalServicesService.request(selectedService.id, {
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
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Banner */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            <Sparkles className="h-3.5 w-3.5" />
            Fixed-Price Legal Deliverables
          </div>
          <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            Legal Document Drafting & Review Marketplace
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl sm:text-sm">
            Engage verified advocates for standardized contract redlines, customized employment agreements, legal
            demand notices, and title investigations with guaranteed turnaround times.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search services by keyword, drafting type, or notice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchServices()}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            {['all', 'Contract Review', 'Corporate Drafting', 'Litigation Notice'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
              <div key={i} className="h-64 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-purple-400 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      {svc.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {svc.estimated_turnaround_days} Days Delivery
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white leading-snug">{svc.title}</h3>

                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{svc.description}</p>

                  {/* Deliverables List */}
                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Included Deliverables</p>
                    {(Array.isArray(svc.deliverables) ? svc.deliverables : []).map((d, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Fixed Package Price</span>
                    <p className="text-xl font-black text-slate-900 dark:text-white">₹{svc.price_amount}</p>
                  </div>

                  <button
                    onClick={() => setSelectedService(svc)}
                    className="flex items-center gap-1 rounded-2xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-800"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white">
            <h3 className="text-base font-bold">Order: {selectedService.title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Fixed Price: ₹{selectedService.price_amount} • Turnaround: {selectedService.estimated_turnaround_days} Days
            </p>

            <form onSubmit={handleOrderService} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Your Requirements & Case Specifics</label>
                <textarea
                  rows={4}
                  required
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Provide party details, specific clauses to amend, notice facts, or link to contract document..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="w-1/3 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Confirming Order...' : `Pay ₹${selectedService.price_amount} & Order`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
