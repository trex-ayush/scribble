import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Smartphone, LogOut, MonitorSmartphone } from 'lucide-react';
import { authApi } from '../../api/auth.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { useFeedback } from '../../components/feedback/FeedbackProvider.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const fmt = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const isMobile = (device = '') => /Android|iOS/i.test(device);

const Spinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-pencil border-t-accent rounded-full animate-spin" />
  </div>
);

export const Sessions = () => {
  const { toast, confirm } = useFeedback();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .getSessions()
      .then(({ data }) => setSessions(data.data.sessions))
      .catch(() => toast.error('Could not load your devices'))
      .finally(() => setLoading(false));
  }, []);

  const revoke = async (s) => {
    const ok = await confirm({
      title: s.current ? 'Log out this device?' : 'Log out device?',
      message: s.current
        ? 'You will be signed out here and sent to the login page.'
        : `"${s.device}" will be signed out.`,
      confirmText: 'Log out',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await authApi.revokeSession(s.id);
      if (s.current) {
        await logout();
        return navigate('/login');
      }
      setSessions((prev) => prev.filter((x) => x.id !== s.id));
      toast.success('Device logged out');
    } catch {
      toast.error('Could not log out that device');
    }
  };

  const revokeOthers = async () => {
    const ok = await confirm({
      title: 'Log out all other devices?',
      message: 'Every device except this one will be signed out.',
      confirmText: 'Log out all',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await authApi.revokeOthers();
      setSessions((prev) => prev.filter((x) => x.current));
      toast.success('Logged out of all other devices');
    } catch {
      toast.error('Could not log out other devices');
    }
  };

  if (loading) return <Spinner />;

  const others = sessions.filter((s) => !s.current);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl text-pencil flex items-center gap-2">
            <MonitorSmartphone size={26} strokeWidth={2.5} className="text-accent" />
            Devices
          </h1>
          <p className="font-body text-pencil/60">
            {sessions.length} active {sessions.length === 1 ? 'device' : 'devices'} signed in to your account.
          </p>
        </div>
        {others.length > 0 && (
          <Button variant="danger" size="sm" onClick={revokeOthers} className="flex items-center gap-1.5">
            <LogOut size={14} strokeWidth={2.5} />
            Log out all other devices
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {sessions.map((s) => {
          const Icon = isMobile(s.device) ? Smartphone : Monitor;
          return (
            <Card key={s.id} className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Icon size={28} strokeWidth={2} className="text-pencil/70 shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-pencil truncate">{s.device}</span>
                    {s.current && (
                      <span className="shrink-0 px-1.5 text-[10px] font-body bg-ink/10 text-ink border border-ink/40 rounded">
                        This device
                      </span>
                    )}
                  </div>
                  <p className="font-body text-sm text-pencil/60 truncate">
                    {s.ip || 'Unknown IP'} · last active {fmt(s.lastActiveAt)}
                  </p>
                  <p className="font-body text-xs text-pencil/40">Signed in {fmt(s.createdAt)}</p>
                </div>
              </div>
              <Button
                variant={s.current ? 'secondary' : 'danger'}
                size="sm"
                onClick={() => revoke(s)}
                className="flex items-center gap-1.5 shrink-0"
              >
                <LogOut size={14} strokeWidth={2.5} />
                Log out
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
