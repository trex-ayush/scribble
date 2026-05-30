import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Card } from '../components/ui/Card.jsx';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', name: '' });
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
      navigate('/');
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
    <div className="max-w-md mx-auto pt-10">
      <Card decoration="tape" className="space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-heading text-3xl text-pencil">Join Scribble</h1>
          <p className="font-body text-pencil/60">Start sharing your ideas today</p>
        </div>

        {errors._global && (
          <p className="font-body text-sm text-accent bg-accent/10 border-2 border-accent px-4 py-3 wobbly-tag">
            {errors._global}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name (optional)"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            autoComplete="name"
          />
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="your_username"
            error={errors.username}
            autoComplete="username"
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
          <Input
            label="Password"
            name="password"
            type="password"
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

        <p className="font-body text-center text-pencil/60 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-ink hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
};
