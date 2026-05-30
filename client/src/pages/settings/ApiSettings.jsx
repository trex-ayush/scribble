import React, { useEffect, useState } from 'react';
import { KeyRound, Copy, Check, RefreshCw, Trash2, Eye, EyeOff } from 'lucide-react';
import { apiKeysApi } from '../../api/apiKeys.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { useFeedback } from '../../components/feedback/FeedbackProvider.jsx';

// Secret/key field that is always visible but masked, with reveal + copy.
const SecretField = ({ label, value, secret = false }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const masked = value ? '•'.repeat(Math.min(value.length, 40)) : '';
  const shown = !secret || revealed ? value : masked;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-1">
      <label className="font-heading text-sm text-pencil">{label}</label>
      <div className="flex items-stretch gap-2">
        <code
          className="flex-1 px-3 py-2 bg-muted/40 border-2 border-pencil text-pencil text-sm font-mono break-all"
          style={{ borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' }}
        >
          {shown}
        </code>
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="px-3 border-2 border-pencil bg-white hover:bg-muted transition-colors"
            style={{ borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' }}
            aria-label={revealed ? 'Hide' : 'Reveal'}
          >
            {revealed ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className="px-3 border-2 border-pencil bg-white hover:bg-muted transition-colors"
          style={{ borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' }}
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check size={16} strokeWidth={2.5} className="text-ink" /> : <Copy size={16} strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
};

const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="w-7 h-7 border-4 border-pencil border-t-accent rounded-full animate-spin" />
  </div>
);

export const ApiSettings = () => {
  const { toast, confirm } = useFeedback();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await apiKeysApi.getSettings();
      setSettings(data.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    if (settings?.hasCredentials) {
      const ok = await confirm({
        title: 'Regenerate credentials?',
        message: 'Your current secret will stop working immediately. Any integrations using it must be updated.',
        confirmText: 'Regenerate',
        tone: 'danger',
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const { data } = await apiKeysApi.generate();
      setSettings(data.data);
      toast.success('API credentials generated');
    } catch {
      toast.error('Could not generate credentials');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async () => {
    setBusy(true);
    try {
      const { data } = await apiKeysApi.toggle(!settings.apiEnabled);
      setSettings((s) => ({ ...s, ...data.data }));
      toast.success(data.data.apiEnabled ? 'API access enabled' : 'API access disabled');
    } catch {
      toast.error('Could not update API access');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    const ok = await confirm({
      title: 'Revoke API access?',
      message: 'Credentials will be deleted permanently. Integrations using them will stop working.',
      confirmText: 'Revoke',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await apiKeysApi.revoke();
      setSettings({ apiKey: null, apiSecret: null, apiEnabled: false, hasCredentials: false });
      toast.success('API credentials revoked');
    } catch {
      toast.error('Could not revoke credentials');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <Card className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-10 h-10 flex items-center justify-center bg-postit border-2 border-pencil rounded-full">
          <KeyRound size={18} strokeWidth={2.5} />
        </span>
        <div>
          <h2 className="font-heading text-2xl text-pencil">API Settings</h2>
          <p className="font-body text-sm text-pencil/60">
            Use these credentials as HTTP Basic Auth to create, edit, and delete posts via the public API.
          </p>
        </div>
      </div>

      {settings?.hasCredentials ? (
        <div className="space-y-4">
          <SecretField label="API Key (username)" value={settings.apiKey} />
          <SecretField label="API Secret (password)" value={settings.apiSecret} secret />

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <span className="flex items-center gap-2 font-body text-sm">
              Status:
              <span
                className={`px-2 py-0.5 border-2 border-pencil wobbly-tag ${settings.apiEnabled ? 'bg-ink/10 text-ink' : 'bg-muted text-pencil/60'}`}
              >
                {settings.apiEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </span>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleToggle} loading={busy} className="flex items-center gap-1.5">
                {settings.apiEnabled ? <EyeOff size={14} strokeWidth={2.5} /> : <Eye size={14} strokeWidth={2.5} />}
                {settings.apiEnabled ? 'Disable' : 'Enable'}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleGenerate} loading={busy} className="flex items-center gap-1.5">
                <RefreshCw size={14} strokeWidth={2.5} />
                Regenerate
              </Button>
              <Button variant="danger" size="sm" onClick={handleRevoke} loading={busy} className="flex items-center gap-1.5">
                <Trash2 size={14} strokeWidth={2.5} />
                Revoke
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-3">
          <p className="font-body text-pencil/70">You haven't created API credentials yet.</p>
          <Button onClick={handleGenerate} loading={busy} className="inline-flex items-center gap-2">
            <KeyRound size={16} strokeWidth={2.5} />
            Generate credentials
          </Button>
        </div>
      )}
    </Card>
  );
};
