import { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  helpText?: string;
  error?: string;
}

export function Input({ label, icon, helpText, error, className = '', ...props }: InputProps) {
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <div className={`field-control ${icon ? 'field-has-icon' : ''}`.trim()}>
        {icon ? <span className="field-icon">{icon}</span> : null}
        <input className={`input-field ${error ? 'input-error' : ''} ${className}`.trim()} {...props} />
      </div>
      {helpText ? <span className="field-help">{helpText}</span> : null}
      {error ? <span className="field-error-text">{error}</span> : null}
    </label>
  );
}
