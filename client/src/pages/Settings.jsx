import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { usersApi } from '../api/users.js';
import { Button } from '../components/ui/Button.jsx';
import { Input, Textarea } from '../components/ui/Input.jsx';
import { Card } from '../components/ui/Card.jsx';
import { useFeedback } from '../components/feedback/FeedbackProvider.jsx';

export const Settings = () => {
  const { user, setUser } = useAuth();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await usersApi.updateProfile(form);
      setUser(data.data.user);
      setSuccess('Profile updated!');
      toast.success('Profile updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      toast.error('Update failed', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card decoration="tape" className="space-y-6">
        <h1 className="font-heading text-3xl text-pencil">Settings</h1>

        {success && (
          <p className="font-body text-sm text-ink bg-ink/10 border-2 border-ink px-4 py-3 wobbly-tag">
            {success}
          </p>
        )}
        {error && (
          <p className="font-body text-sm text-accent bg-accent/10 border-2 border-accent px-4 py-3 wobbly-tag">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your full name"
          />
          <Textarea
            label="Bio"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="Tell readers about yourself..."
            rows={4}
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Save changes</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
