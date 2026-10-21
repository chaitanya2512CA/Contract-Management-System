import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, Sparkles } from 'lucide-react';
import { eventService } from '../../services/api';
import { CollegeEvent } from '../../types';
import { EventCard } from '../../components/events/EventCard';
import { EventFilters } from '../../components/events/EventFilters';
import { EventCardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const ExploreEventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [price, setPrice] = useState(searchParams.get('price') || 'all');
  const [venueType, setVenueType] = useState(searchParams.get('venueType') || 'all');

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const res = await eventService.getEvents({
          search: search || undefined,
          category: category !== 'All' ? category : undefined,
          isPaid: price !== 'all' ? price : undefined,
          venueType: venueType !== 'all' ? venueType : undefined,
          limit: 24,
        });

        if (res.data.success) {
          setEvents(res.data.events || []);
        }
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [search, category, price, venueType]);

  const handleReset = () => {
    setSearch('');
    setCategory('All');
    setPrice('all');
    setVenueType('all');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Campus Discovery
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Explore All University Events
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Find technical hackathons, guest lectures, workshops, cultural fests, and athletic competitions.
          </p>
        </div>

        {/* Filters Component */}
        <EventFilters
          search={search}
          onSearchChange={setSearch}
          selectedCategory={category}
          onCategoryChange={setCategory}
          selectedPrice={price}
          onPriceChange={setPrice}
          selectedVenueType={venueType}
          onVenueTypeChange={setVenueType}
          onReset={handleReset}
        />

        {/* Event Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            title="No events match your search criteria"
            description="Try modifying your keyword search or resetting category filters."
            action={
              <button
                onClick={handleReset}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                Reset Filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
