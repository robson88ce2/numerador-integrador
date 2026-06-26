import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const badgeClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'badge-default',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return <span className={`badge ${badgeClasses[variant]}`.trim()}>{children}</span>;
}
