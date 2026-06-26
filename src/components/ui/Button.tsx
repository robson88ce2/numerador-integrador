import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'button-primary',
  secondary: 'button-secondary',
  ghost: 'button-ghost',
  danger: 'button-danger',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'button-sm',
  md: 'button-md',
  lg: 'button-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }, ref) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`button ${variantClasses[variant]} ${sizeClasses[size]} ${isDisabled ? 'button-disabled' : ''} ${className}`.trim()}
        {...props}
      >
        {loading ? 'Carregando...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
