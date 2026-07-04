import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.jsx';
import { Input, PasswordInput } from '../components/ui/Input.jsx';
import { AuthShell } from '../components/auth/AuthShell.jsx';
import { safeNext, withNext } from '../lib/authRedirect.js';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [form, setForm] = useState({ name: '', email: '', password: '', username: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      navigate(next, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        const fieldErrors = {};
        data.errors.forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
      } else {
        setErrors({ _global: data?.message || 'Registration failed.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      variant="register"
      title="Join Scribble"
      subtitle="Start sharing your ideas today"
      error={errors._global}
      footer={
        <>
          Already have an account?{' '}
          <Link to={withNext('/login', next)} className="text-ink hover:underline font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your name"
          error={errors.name}
          autoComplete="name"
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          error={errors.email}
          autoComplete="email"
          required
        />
        <div className="space-y-1">
          <Input
            label="Username (optional)"
            name="username"
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))
            }
            placeholder="Leave blank and we'll pick one"
            error={errors.username}
            autoComplete="username"
          />
          <p className="font-body text-xs text-pencil/50">
            You can set or change this later in Settings.
          </p>
        </div>
        <PasswordInput
          label="Password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Min. 6 characters"
          error={errors.password}
          autoComplete="new-password"
          required
        />
        <Button type="submit" loading={loading} className="w-full justify-center">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
};
