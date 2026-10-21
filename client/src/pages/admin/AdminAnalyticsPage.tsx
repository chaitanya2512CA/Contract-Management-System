import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { BarChart3, TrendingUp, Users, Award, Calendar, Sparkles } from 'lucide-react';
import { adminService, eventService } from '../../services/api';
import { AdminStats, CollegeEvent } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

const COLORS = ['#4f46e5', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

export const AdminAnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [topEvents, setTopEvents] = useState<CollegeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const [statsRes, trendRes] = await Promise.all([
          adminService.getStats(),
          eventService.getTrendingEvents(),
        ]);
        if (statsRes.data.success) setStats(statsRes.data.stats);
        if (trendRes.data.success) setTopEvents(trendRes.data.events || []);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl font-serif">
          Campus Analytics & Engagement Intelligence
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          In-depth reports on student event turnout, category popularity, and monthly participation trends.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Registrations"
          value={stats?.participation?.totalRegistrations || 0}
          subtitle="Cumulative tickets booked"
          icon={<Users className="h-5 w-5" />}
          color="indigo"
        />
        <StatCard
          title="Verified Attendance"
          value={stats?.participation?.totalAttended || 0}
          subtitle="QR code gate check-ins"
          icon={<Award className="h-5 w-5" />}
          color="emerald"
        />
        <StatCard
          title="Campus Turnout Ratio"
          value={`${stats?.participation?.attendanceRate || 0}%`}
          subtitle="Overall attendance conversion"
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Signups Area Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Monthly Participation Timeline
          </h2>
          <p className="text-xs text-slate-400">Registrations vs actual QR verified attendances</p>

          <div className="mt-6 h-72 w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Loading chart...
              </div>
            ) : !stats?.monthlyRegistrations?.length ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No monthly data recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyRegistrations}>
                  <defs>
                    <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" />
                  <YAxis fontSize={11} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    name="Registrations"
                    stroke="#4f46e5"
                    fillOpacity={1}
                    fill="url(#colorReg)"
                  />
                  <Area
                    type="monotone"
                    dataKey="attended"
                    name="Attended"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorAtt)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Category Share & Popularity
          </h2>
          <p className="text-xs text-slate-400">Proportion of events by activity domain</p>

          <div className="mt-6 h-72 w-full flex items-center justify-center">
            {isLoading ? (
              <div className="text-xs text-slate-400">Loading chart...</div>
            ) : !stats?.categoryStats?.length ? (
              <div className="text-xs text-slate-400">No events categorized yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryStats}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    paddingAngle={3}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    fontSize={11}
                  >
                    {stats.categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Most Popular Events Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
          Most Engaged Campus Events
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="py-2.5 px-3">Event Title</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Enrolled Attendees</th>
                <th className="py-2.5 px-3">Capacity Fill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {topEvents.map((ev) => {
                const percent = Math.min(
                  100,
                  Math.round(((ev.registeredCount || 0) / ev.maxCapacity) * 100)
                );
                return (
                  <tr key={ev._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {ev.title}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {ev.category}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(ev.eventDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {ev.registeredCount} / {ev.maxCapacity}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-indigo-600" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-[11px] font-bold">{percent}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
