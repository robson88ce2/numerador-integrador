import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  duration?: number;
}

export function Toast({ message, type = 'success', duration = 2800 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(timer);
  }, [message, duration]);

  if (!message) return null;

  return (
    <div className={`toast ${type} ${visible ? 'toast-visible' : ''}`.trim()} role="status" aria-live="polite">
      {message}
    </div>
  );
}
