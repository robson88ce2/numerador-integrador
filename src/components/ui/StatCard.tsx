import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, description, icon }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        {icon ? <span className="stat-card-icon">{icon}</span> : null}
      </div>
      <div className="stat-card-value">{value}</div>
      {description ? <p className="stat-card-description">{description}</p> : null}
    </div>
  );
}
