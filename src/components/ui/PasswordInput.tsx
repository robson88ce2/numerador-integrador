import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from './Input';

interface PasswordInputProps {
  label?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
}

export function PasswordInput({ label = 'Senha', value, onChange, placeholder, error }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <div className="field-control field-has-icon">
        <span className="field-icon">
          <Lock size={18} />
        </span>
        <input
          type={visible ? 'text' : 'password'}
          className={`input-field ${error ? 'input-error' : ''}`.trim()}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="field-action"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error ? <span className="field-error-text">{error}</span> : null}
    </label>
  );
}
