import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon ? <div className="empty-state-icon">{icon}</div> : null}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
