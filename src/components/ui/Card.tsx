import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <section className={`card-panel ${className}`.trim()}>
      {title ? <div className="card-header"><h2>{title}</h2></div> : null}
      <div className="card-body">{children}</div>
    </section>
  );
}
