import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'outline'
    | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const variantStyles = {
    primary: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
    secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    info: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    outline: 'bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const mapping: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    Technical: { variant: 'info', label: 'Technical' },
    Hackathon: { variant: 'purple', label: 'Hackathon' },
    Workshop: { variant: 'primary', label: 'Workshop' },
    Seminar: { variant: 'secondary', label: 'Seminar' },
    Cultural: { variant: 'warning', label: 'Cultural' },
    Sports: { variant: 'success', label: 'Sports' },
    Conference: { variant: 'info', label: 'Conference' },
    Webinar: { variant: 'secondary', label: 'Webinar' },
  };

  const config = mapping[category] || { variant: 'secondary', label: category };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'approved':
    case 'registered':
    case 'attended':
    case 'valid':
      return <Badge variant="success">● {status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    case 'pending_approval':
      return <Badge variant="warning">⏳ Pending Approval</Badge>;
    case 'waitlisted':
      return <Badge variant="info">⏱ Waitlisted</Badge>;
    case 'rejected':
      return <Badge variant="danger">✕ Rejected</Badge>;
    case 'cancelled':
      return <Badge variant="danger">Cancelled</Badge>;
    case 'completed':
      return <Badge variant="secondary">✓ Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};
