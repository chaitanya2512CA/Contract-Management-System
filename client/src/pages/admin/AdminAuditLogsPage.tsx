import React, { useState, useEffect } from 'react';
import { FileText, Shield, Search, Filter, Calendar, Terminal } from 'lucide-react';
import { adminService } from '../../services/api';
import { AuditLogItem } from '../../types';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [actionFilter, setActionFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getAuditLogs({
        action: actionFilter,
        targetType: targetFilter,
      });
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetFilter]);

  const getActionColor = (action: string) => {
    if (action.includes('APPROVE') || action.includes('REACTIVATE')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    if (action.includes('REJECT') || action.includes('DEACTIVATE') || action.includes('CANCEL')) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
    if (action.includes('ADMIN') || action.includes('ROLE')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl font-serif">
          Institutional System Audit Logs
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Permanent administrative compliance trail. Records event moderation decisions, role modifications, and admin logins.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Audit Event Filter
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              <option value="all">All Administrative Actions</option>
              <option value="APPROVE_EVENT">APPROVE_EVENT</option>
              <option value="REJECT_EVENT">REJECT_EVENT</option>
              <option value="CREATE_ADMIN">CREATE_ADMIN</option>
              <option value="UPDATE_USER_ROLE">UPDATE_USER_ROLE</option>
              <option value="DEACTIVATE_USER">DEACTIVATE_USER</option>
              <option value="ADMIN_LOGIN">ADMIN_LOGIN</option>
            </select>

            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              <option value="all">All Targets</option>
              <option value="Event">Event Target</option>
              <option value="User">User Target</option>
              <option value="System">System Target</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit entries found"
            description="No administrative activities match the current filter selection."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Administrator</th>
                  <th className="py-3 px-3">Action Executed</th>
                  <th className="py-3 px-3">Resource Target</th>
                  <th className="py-3 px-3">Details & Audit Metadata</th>
                  <th className="py-3 px-3">IP Origin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-sans whitespace-nowrap">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{log.adminName}</p>
                      <p className="text-[10px] text-slate-400">{log.adminEmail}</p>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 font-bold ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-sans text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{log.targetName || log.targetType}</span>
                    </td>

                    <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-400 max-w-sm">
                      {log.details}
                    </td>

                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
