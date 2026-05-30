import React from 'react';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'font-body px-4 py-2 text-pencil hover:bg-muted transition-colors duration-100 cursor-pointer rounded',
};

const SIZES = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export const Button = React.forwardRef(
  ({ children, variant = 'primary', size = 'md', className = '', disabled, loading, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[VARIANTS[variant], SIZES[size], className].filter(Boolean).join(' ')}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
);

Button.displayName = 'Button';
