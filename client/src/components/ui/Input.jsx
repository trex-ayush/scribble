import React from 'react';

export const Input = React.forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="font-heading text-sm text-pencil">{label}</label>}
    <input
      ref={ref}
      className={['input', error ? 'input-error' : '', className].filter(Boolean).join(' ')}
      {...props}
    />
    {error && <p className="font-body text-sm text-accent">{error}</p>}
  </div>
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="font-heading text-sm text-pencil">{label}</label>}
    <textarea
      ref={ref}
      className={['input resize-none', error ? 'input-error' : '', className].filter(Boolean).join(' ')}
      {...props}
    />
    {error && <p className="font-body text-sm text-accent">{error}</p>}
  </div>
));
Textarea.displayName = 'Textarea';
