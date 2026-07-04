import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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

// Password field with a reveal/hide toggle — reuses the shared .input style.
export const PasswordInput = React.forwardRef(({ label, error, className = '', ...props }, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="font-heading text-sm text-pencil">{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          className={['input pr-11', error ? 'input-error' : '', className].filter(Boolean).join(' ')}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-pencil/50 hover:text-ink transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
        </button>
      </div>
      {error && <p className="font-body text-sm text-accent">{error}</p>}
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

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
