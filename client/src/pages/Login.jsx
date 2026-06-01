import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Card } from '../components/ui/Card.jsx';
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
    <div className="max-w-md mx-auto pt-10">
      <Card decoration="tack" className="space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-heading text-3xl text-pencil">Welcome back!</h1>
          <p className="font-body text-pencil/60">Sign in to continue writing</p>
        </div>

        {error && (
          <p className="font-body text-sm text-accent bg-accent/10 border-2 border-accent px-4 py-3 wobbly-tag">
            {error}
          </p>
        )}

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
          <Input
            label="Password"
            name="password"
            type="password"
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

        <p className="font-body text-center text-pencil/60 text-sm">
          Don't have an account?{' '}
          <Link to={withNext('/register', next)} className="text-ink hover:underline font-medium">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
};
