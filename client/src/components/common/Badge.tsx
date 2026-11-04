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
    | 'gold'
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
    primary: 'bg-amber-100 text-amber-900 dark:bg-[#1A1A1A] dark:text-[#D4AF37] border border-amber-200 dark:border-[#262118]',
    gold: 'bg-[#1A1A1A] text-[#D4AF37] border border-[#262118]',
    secondary: 'bg-slate-100 text-slate-700 dark:bg-[#121212] dark:text-[#A39E93] border border-slate-200 dark:border-[#262118]',
    default: 'bg-slate-100 text-slate-700 dark:bg-[#121212] dark:text-[#A39E93] border border-slate-200 dark:border-[#262118]',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-[#10B981]/10 dark:text-[#10B981] border border-emerald-200 dark:border-[#10B981]/30',
    warning: 'bg-amber-100 text-amber-800 dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] border border-amber-200 dark:border-[#D4AF37]/30',
    danger: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40',
    info: 'bg-sky-100 text-sky-800 dark:bg-[#1A1A1A] dark:text-[#D4AF37] border border-sky-200 dark:border-[#262118]',
    purple: 'bg-purple-100 text-purple-800 dark:bg-[#1A1A1A] dark:text-[#F5E6C4] border border-purple-200 dark:border-[#262118]',
    outline: 'bg-transparent text-slate-700 dark:text-[#A39E93] border border-slate-300 dark:border-[#262118]',
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
