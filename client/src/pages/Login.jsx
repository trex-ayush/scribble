import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.jsx';
import { Input, PasswordInput } from '../components/ui/Input.jsx';
import { AuthShell } from '../components/auth/AuthShell.jsx';
import { safeNext, withNext } from '../lib/authRedirect.js';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      variant="login"
      title="Welcome back!"
      subtitle="Sign in to continue writing"
      error={error}
      footer={
        <>
          Don't have an account?{' '}
          <Link to={withNext('/register', next)} className="text-ink hover:underline font-medium">
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email or username"
          name="identifier"
          type="text"
          value={form.identifier}
          onChange={handleChange}
          placeholder="you@example.com or your_username"
          autoComplete="username"
          required
        />
        <PasswordInput
          label="Password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        <Button type="submit" loading={loading} className="w-full justify-center">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
};
