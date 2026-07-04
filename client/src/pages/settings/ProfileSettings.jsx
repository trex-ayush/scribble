import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { usersApi } from '../../api/users.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Textarea } from '../../components/ui/Input.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { useFeedback } from '../../components/feedback/FeedbackProvider.jsx';
import { workspaceStore } from '../../store/workspaceStore.js';

export const ProfileSettings = () => {
  const { user, setUser } = useAuth();
  const { toast } = useFeedback();
  const active = workspaceStore((s) => s.active);
  // The API only edits your OWN profile, so impersonation is view-only.
  const canEdit = !active;
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '', username: user?.username || '' });
  const [loading, setLoading] = useState(false);

  // While impersonating, load the workspace owner's profile instead of our own.
  useEffect(() => {
    if (!active) {
      setForm({ name: user?.name || '', bio: user?.bio || '', username: user?.username || '' });
      return;
    }
    let alive = true;
    usersApi
      .getProfile(active.username)
      .then(({ data }) => {
        if (alive) {
          const u = data.data.user;
          setForm({ name: u.name || '', bio: u.bio || '', username: u.username || '' });
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [active, user?.name, user?.bio, user?.username]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await usersApi.updateProfile(form);
      // Only sync our own auth user — not the owner we're impersonating.
      if (!active) setUser(data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Update failed', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl text-pencil">Profile</h2>
        <p className="font-body text-sm text-pencil/60">
          {active ? `Viewing ${active.name}'s profile (read-only).` : 'Update how others see you.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Display name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your full name"
          disabled={!canEdit}
        />
        <div className="space-y-1">
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))
            }
            placeholder="your_username"
            disabled={!canEdit}
          />
          {canEdit && (
            <p className="font-body text-xs text-pencil/50">
              Your public handle — readers find you at <span className="text-ink">/@{form.username || 'username'}</span>
            </p>
          )}
        </div>
        <Textarea
          label="Bio"
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Tell readers about yourself..."
          rows={4}
          disabled={!canEdit}
        />
        {canEdit && <Button type="submit" loading={loading}>Save changes</Button>}
      </form>
    </Card>
  );
};
