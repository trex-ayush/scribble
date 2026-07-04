import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Webhook as WebhookIcon, Plus, Trash2, RefreshCw, Copy, Check, X, Send,
  Eye, EyeOff, Power, AlertTriangle, Lock, Repeat, ChevronLeft, ChevronRight,
  MoreVertical, Pencil,
} from 'lucide-react';
import { webhooksApi } from '../../api/webhooks.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { EventDataBox } from '../../components/activity/EventDataBox.jsx';
import { useFeedback } from '../../components/feedback/FeedbackProvider.jsx';

const wobbly = { borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' };
const wobblyTag = { borderRadius: '14px 6px 14px 6px / 6px 14px 6px 14px' };

const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="w-7 h-7 border-4 border-pencil border-t-accent rounded-full animate-spin" />
  </div>
);

const fmtDate = (d) => new Date(d).toLocaleString();

const groupEvents = (events) => {
  const map = new Map();
  for (const ev of events) {
    if (!map.has(ev.group)) map.set(ev.group, []);
    map.get(ev.group).push(ev);
  }
  return [...map.entries()];
};

// --- Small building blocks ------------------------------------------------

const SecretField = ({ value }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const masked = value ? '•'.repeat(Math.min(value.length, 40)) : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-1">
      <label className="font-heading text-xs text-pencil/70">Signing secret</label>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 px-3 py-1.5 bg-muted/40 border-2 border-pencil text-pencil text-xs font-mono break-all" style={wobbly}>
          {revealed ? value : masked}
        </code>
        <button type="button" onClick={() => setRevealed((r) => !r)} className="px-3 border-2 border-pencil bg-white hover:bg-muted transition-colors" style={wobbly} aria-label={revealed ? 'Hide' : 'Reveal'}>
          {revealed ? <EyeOff size={15} strokeWidth={2.5} /> : <Eye size={15} strokeWidth={2.5} />}
        </button>
        <button type="button" onClick={copy} className="px-3 border-2 border-pencil bg-white hover:bg-muted transition-colors" style={wobbly} aria-label="Copy signing secret">
          {copied ? <Check size={15} strokeWidth={2.5} className="text-ink" /> : <Copy size={15} strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
};

const EventChip = ({ event, active, onToggle, disabled }) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled}
    title={event.description}
    className={[
      'flex items-center gap-1 px-2.5 py-1 text-xs font-body border-2 transition-colors disabled:opacity-50',
      active ? 'bg-ink text-paper border-pencil' : 'bg-white text-pencil/70 border-pencil hover:bg-muted',
    ].join(' ')}
    style={wobblyTag}
  >
    {active && <Check size={11} strokeWidth={3} />}
    {event.label}
  </button>
);

// Hand-drawn checkbox, used everywhere a checkbox is needed (no native inputs,
// so the whole form stays visually consistent).
const CheckBox = ({ checked, onChange, disabled, className = '', children }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={['flex items-center gap-2 disabled:opacity-50', className].filter(Boolean).join(' ')}
  >
    <span
      className={`w-4 h-4 flex items-center justify-center border-2 border-pencil shrink-0 ${checked ? 'bg-ink text-paper' : 'bg-white'}`}
      style={{ borderRadius: '4px 2px 4px 2px' }}
    >
      {checked && <Check size={11} strokeWidth={4} />}
    </span>
    {children}
  </button>
);

// Grouped event picker with a per-group "All" select-all.
const EventSelector = ({ events, value, onChange, disabled }) => {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const toggleGroup = (vals) => {
    const allOn = vals.every((v) => value.includes(v));
    onChange(allOn ? value.filter((v) => !vals.includes(v)) : [...new Set([...value, ...vals])]);
  };

  return (
    <div className="space-y-3">
      {groupEvents(events).map(([group, evs]) => {
        const vals = evs.map((e) => e.value);
        const allOn = vals.every((v) => value.includes(v));
        return (
          <div key={group} className="space-y-1.5">
            <CheckBox
              checked={allOn}
              onChange={() => toggleGroup(vals)}
              disabled={disabled}
              className="font-heading text-xs text-pencil/70 hover:text-pencil"
            >
              All {group}
            </CheckBox>
            <div className="flex flex-wrap gap-2 pl-1">
              {evs.map((ev) => (
                <EventChip key={ev.value} event={ev} active={value.includes(ev.value)} onToggle={() => toggle(ev.value)} disabled={disabled} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Webhook form (create + edit) -----------------------------------------

const blankForm = { name: '', url: '', events: [], retry: true, authOn: false, user: '', pass: '' };

const formFromHook = (hook) => ({
  name: hook.name,
  url: hook.url,
  events: [...hook.events],
  retry: hook.retry,
  authOn: hook.hasBasicAuth,
  user: hook.basicAuth?.username || '',
  pass: '',
});

const WebhookForm = ({ events, initial, onSaved, onCancel }) => {
  const { toast } = useFeedback();
  const editing = !!initial;
  const [f, setF] = useState(() => (initial ? formFromHook(initial) : blankForm));
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (patch) => {
    setF((p) => ({ ...p, ...patch }));
    // Clear the touched field's error (and the auth fields when toggling auth).
    setErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(patch)) delete next[k];
      if ('authOn' in patch) { delete next.user; delete next.pass; }
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!f.name.trim()) errs.name = 'Name is required';
    if (!f.url.trim()) errs.url = 'URL is required';
    if (f.events.length === 0) errs.events = 'Select at least one event';
    if (f.authOn) {
      if (!f.user.trim()) errs.user = 'Username is required';
      // On edit, a blank password keeps the existing one; otherwise it's required.
      const keepingExisting = editing && initial?.hasBasicAuth;
      if (!f.pass && !keepingExisting) errs.pass = 'Password is required';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const payload = {
        name: f.name.trim(),
        url: f.url.trim(),
        events: f.events,
        retry: f.retry,
        basicAuth: f.authOn ? { username: f.user, password: f.pass } : null,
      };
      if (editing) {
        const { data } = await webhooksApi.update(initial.id, payload);
        toast.success('Webhook updated');
        onSaved(data.data);
      } else {
        const { data } = await webhooksApi.create(payload);
        const hook = data.data;
        toast.success('Webhook created');
        // Ping the endpoint (best-effort) so the owner knows it's wired up.
        webhooksApi.test(hook.id).then(({ data: t }) => {
          const r = t.data;
          if (r?.ok) toast.success('Test event delivered', `Your endpoint responded ${r.statusCode}.`);
          else toast.error('Test event failed', r?.error || 'See the Webhook Events log.');
        }).catch(() => {});
        onSaved(hook);
      }
    } catch (err) {
      toast.error(editing ? 'Could not update webhook' : 'Could not create webhook', err.response?.data?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Webhook name" placeholder="e.g. My integration" value={f.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} />
      <Input label="Endpoint URL" placeholder="https://example.com/hooks/scribble" value={f.url} onChange={(e) => set({ url: e.target.value })} error={errors.url} />

      <div className="space-y-2">
        <label className="font-heading text-sm text-pencil">Events to send</label>
        <EventSelector events={events} value={f.events} onChange={(events) => set({ events })} disabled={busy} />
        {errors.events && <p className="font-body text-sm text-accent">{errors.events}</p>}
      </div>

      <div className="space-y-2">
        <CheckBox checked={f.authOn} onChange={(v) => set({ authOn: v })} className="font-body text-sm text-pencil">
          <span className="flex items-center gap-1.5"><Lock size={13} strokeWidth={2.5} /> Protect URL with Basic Auth</span>
        </CheckBox>
        {f.authOn ? (
          <div className="space-y-1.5 pl-6">
            <p className="font-body text-xs text-pencil/50">
              We send this username &amp; password with every request (HTTP Basic Auth) so your server can confirm it's really us.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="username" value={f.user} onChange={(e) => set({ user: e.target.value })} error={errors.user} />
              <Input type="password" placeholder={editing && initial?.hasBasicAuth ? 'leave blank to keep' : 'password'} value={f.pass} onChange={(e) => set({ pass: e.target.value })} error={errors.pass} />
            </div>
          </div>
        ) : (
          <p className="font-body text-xs text-pencil/50 pl-6">Optional — send a username &amp; password with each request.</p>
        )}
        <CheckBox checked={f.retry} onChange={(v) => set({ retry: v })} className="font-body text-sm text-pencil">
          <span className="flex items-center gap-1.5"><Repeat size={13} strokeWidth={2.5} /> Retry on failure</span>
        </CheckBox>
      </div>

      {editing && <SecretField value={initial.secret} />}

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy} className="inline-flex items-center gap-1.5">
          {editing ? <><Check size={15} strokeWidth={2.5} /> Save changes</> : <><Plus size={15} strokeWidth={2.5} /> Add webhook</>}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={busy}>Cancel</Button>
        )}
      </div>
    </form>
  );
};

// --- One webhook row ------------------------------------------------------

// The hook's chosen events, grouped for a compact read-only summary.
const eventSummary = (hookEvents, catalog) => {
  const byValue = new Map(catalog.map((e) => [e.value, e]));
  const map = new Map();
  for (const v of hookEvents) {
    const ev = byValue.get(v);
    if (!ev) continue;
    if (!map.has(ev.group)) map.set(ev.group, []);
    map.get(ev.group).push(ev.label);
  }
  return [...map.entries()];
};

const KebabMenu = ({ items }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button type="button" onClick={() => setOpen((o) => !o)} className="p-1.5 text-pencil/60 hover:text-pencil transition-colors" aria-label="Actions">
        <MoreVertical size={18} strokeWidth={2.5} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border-2 border-pencil shadow-hard z-40 overflow-hidden" style={wobbly}>
            {items.map((it) => (
              <button
                key={it.label}
                type="button"
                onClick={() => { setOpen(false); it.onClick(); }}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 font-body text-sm hover:bg-muted transition-colors ${it.danger ? 'text-accent' : 'text-pencil'}`}
              >
                {it.icon}{it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const WebhookRow = ({ hook, events, onChange, onRemove, onEdit }) => {
  const { toast, confirm } = useFeedback();

  const patch = async (payload, msg) => {
    try {
      const { data } = await webhooksApi.update(hook.id, payload);
      onChange(data.data);
      if (msg) toast.success(msg);
    } catch (err) {
      toast.error('Could not update webhook', err.response?.data?.message);
    }
  };

  const rotate = async () => {
    const ok = await confirm({
      title: 'Rotate signing secret?',
      message: 'The current secret stops working immediately. Update your receiver with the new one.',
      confirmText: 'Rotate', tone: 'danger',
    });
    if (!ok) return;
    try {
      const { data } = await webhooksApi.rotateSecret(hook.id);
      onChange(data.data);
      toast.success('Signing secret rotated');
    } catch {
      toast.error('Could not rotate secret');
    }
  };

  const sendTest = async () => {
    try {
      const { data } = await webhooksApi.test(hook.id);
      const r = data.data;
      if (r?.ok) toast.success('Test event delivered', `Endpoint responded ${r.statusCode}.`);
      else toast.error('Test event failed', r?.error || 'See Webhook Events.');
    } catch {
      toast.error('Could not send test');
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete webhook?',
      message: 'This endpoint will stop receiving events and its delivery log is removed. This cannot be undone.',
      confirmText: 'Delete', tone: 'danger',
    });
    if (!ok) return;
    try {
      await webhooksApi.remove(hook.id);
      onRemove(hook.id);
      toast.success('Webhook deleted');
    } catch {
      toast.error('Could not delete webhook');
    }
  };

  const summary = eventSummary(hook.events, events);
  const menuItems = [
    { label: 'Edit', icon: <Pencil size={14} strokeWidth={2.5} />, onClick: () => onEdit(hook) },
    { label: 'Send test', icon: <Send size={14} strokeWidth={2.5} />, onClick: sendTest },
    {
      label: hook.active ? 'Mark inactive' : 'Mark active',
      icon: <Power size={14} strokeWidth={2.5} />,
      onClick: () => patch({ active: !hook.active }, hook.active ? 'Marked inactive' : 'Marked active'),
    },
    { label: 'Rotate secret', icon: <RefreshCw size={14} strokeWidth={2.5} />, onClick: rotate },
    { label: 'Delete', icon: <Trash2 size={14} strokeWidth={2.5} />, onClick: remove, danger: true },
  ];

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 text-xs border-2 wobbly-tag ${hook.active ? 'bg-ink/10 text-ink border-ink' : 'bg-accent/10 text-accent border-accent'}`}>
              {hook.active ? 'Active' : 'Inactive'}
            </span>
            <h3 className="font-heading text-lg text-pencil truncate">{hook.name}</h3>
          </div>
          <code className="block font-mono text-xs text-pencil/70 break-all">{hook.url}</code>

          <div className="space-y-0.5 pt-1">
            {summary.map(([group, labels]) => (
              <p key={group} className="font-body text-sm text-pencil/80">
                <span className="font-semibold text-pencil">{group}:</span> {labels.join(', ')}
              </p>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-body text-pencil/50 pt-1">
            {hook.hasBasicAuth && <span className="flex items-center gap-1"><Lock size={11} strokeWidth={2.5} /> Basic Auth</span>}
            <span className="flex items-center gap-1"><Repeat size={11} strokeWidth={2.5} /> Retry {hook.retry ? 'on' : 'off'}</span>
            {hook.lastDeliveryAt && (
              <span className="flex items-center gap-1">
                {hook.lastError
                  ? <AlertTriangle size={11} strokeWidth={2.5} className="text-accent" />
                  : <Check size={11} strokeWidth={2.5} className="text-ink" />}
                {hook.lastError ? hook.lastError : `OK (${hook.lastStatus})`} · {fmtDate(hook.lastDeliveryAt)}
              </span>
            )}
          </div>
        </div>

        <KebabMenu items={menuItems} />
      </div>
    </Card>
  );
};

// --- Webhooks tab ---------------------------------------------------------

// Prev / page-count / next control, shared by both tabs.
const Pager = ({ page, pages, onChange }) =>
  pages > 1 ? (
    <div className="flex items-center justify-center gap-3 pt-1">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="p-1.5 border-2 border-pencil bg-white disabled:opacity-40" style={wobbly} aria-label="Previous">
        <ChevronLeft size={16} strokeWidth={2.5} />
      </button>
      <span className="font-body text-sm text-pencil/60">{page} / {pages}</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="p-1.5 border-2 border-pencil bg-white disabled:opacity-40" style={wobbly} aria-label="Next">
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>
    </div>
  ) : null;

const HOOKS_PER_PAGE = 5;

const WebhooksTab = ({ events, hooks, setHooks, onEdit }) => {
  const [page, setPage] = useState(1);
  const pages = Math.ceil(hooks.length / HOOKS_PER_PAGE) || 1;
  const safePage = Math.min(page, pages);
  const shown = hooks.slice((safePage - 1) * HOOKS_PER_PAGE, safePage * HOOKS_PER_PAGE);

  if (hooks.length === 0) {
    return <p className="text-center font-body text-pencil/50 py-8">No webhooks yet. Click “Add Webhook” to create one.</p>;
  }

  return (
    <div className="space-y-6">
      {shown.map((hook) => (
        <WebhookRow
          key={hook.id}
          hook={hook}
          events={events}
          onEdit={onEdit}
          onChange={(updated) => setHooks((h) => h.map((w) => (w.id === updated.id ? updated : w)))}
          onRemove={(id) => setHooks((h) => h.filter((w) => w.id !== id))}
        />
      ))}
      <Pager page={safePage} pages={pages} onChange={setPage} />
    </div>
  );
};

// --- Delivery detail (right-side drawer, matching the Activity Log) --------

const parseBody = (raw) => {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return { raw }; }
};

const DeliveryPanel = ({ id, onClose }) => {
  const [delivery, setDelivery] = useState(null);
  useEffect(() => {
    let alive = true;
    webhooksApi.getDelivery(id).then(({ data }) => { if (alive) setDelivery(data.data.delivery); }).catch(() => {});
    return () => { alive = false; };
  }, [id]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-end bg-pencil/40" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full bg-paper border-l-[3px] border-pencil shadow-hard-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b-2 border-dashed border-pencil flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-heading text-2xl text-pencil">Delivery</h2>
            {delivery && (
              <>
                <p className="font-body text-sm text-pencil/60">Event — {delivery.event}</p>
                <p className="font-body text-sm text-pencil/60">
                  Status — <span className={delivery.status === 'success' ? 'text-ink' : 'text-accent'}>{delivery.status} ({delivery.statusCode ?? '—'})</span>
                  {` · ${delivery.attempts} attempt${delivery.attempts === 1 ? '' : 's'}`}
                </p>
                <p className="font-body text-sm text-pencil/60">Webhook — {delivery.webhook?.name || '—'}</p>
                <p className="font-body text-sm text-pencil/60">Event ID — {delivery.eventId}</p>
                <p className="font-body text-sm text-pencil/60">Occurred — {fmtDate(delivery.createdAt)}</p>
                {delivery.error && <p className="font-body text-sm text-accent">Error — {delivery.error}</p>}
              </>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-pencil/60 hover:text-accent transition-colors shrink-0" aria-label="Close">
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {!delivery ? <Spinner /> : (
            <>
              <EventDataBox data={parseBody(delivery.requestBody)} title="Request payload" />
              <div className="bg-white border-2 border-pencil shadow-hard overflow-hidden" style={{ borderRadius: '15px 255px 15px 225px / 225px 15px 255px 15px' }}>
                <div className="px-5 py-3 border-b-2 border-dashed border-pencil bg-muted/30">
                  <h3 className="font-heading text-lg text-pencil">Response</h3>
                </div>
                <div className="p-5">
                  <pre className="font-mono text-xs text-pencil bg-muted/40 p-4 rounded overflow-auto whitespace-pre-wrap break-all">{delivery.responseBody || '—'}</pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- Webhook Events (delivery log) tab ------------------------------------

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 text-xs border-2 border-pencil ${status === 'success' ? 'bg-ink/10 text-ink' : 'bg-accent/10 text-accent'}`} style={wobblyTag}>
    {status}
  </span>
);

const EventsTab = ({ events, hooks }) => {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ webhook: '', event: '', status: '' });
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.webhook) params.webhook = filters.webhook;
      if (filters.event) params.event = filters.event;
      if (filters.status) params.status = filters.status;
      const { data: res } = await webhooksApi.listDeliveries(params);
      setData(res.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, filters]);

  const setFilter = (patch) => { setPage(1); setFilters((f) => ({ ...f, ...patch })); };
  const selectCls = 'px-2 py-1.5 bg-white border-2 border-pencil font-body text-sm';

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading text-lg text-pencil">Deliveries</h2>
        <span className="font-body text-sm text-pencil/60">{data.total} events</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <select className={selectCls} style={wobbly} value={filters.webhook} onChange={(e) => setFilter({ webhook: e.target.value })}>
          <option value="">All webhooks</option>
          {hooks.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <select className={selectCls} style={wobbly} value={filters.event} onChange={(e) => setFilter({ event: e.target.value })}>
          <option value="">All events</option>
          {events.map((ev) => <option key={ev.value} value={ev.value}>{ev.value}</option>)}
        </select>
        <select className={selectCls} style={wobbly} value={filters.status} onChange={(e) => setFilter({ status: e.target.value })}>
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? <Spinner /> : data.items.length === 0 ? (
        <p className="text-center font-body text-pencil/50 py-6">No deliveries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-left text-pencil/50 border-b-2 border-dashed border-pencil/40">
                <th className="py-2 pr-3 font-heading font-normal">Occurred</th>
                <th className="py-2 pr-3 font-heading font-normal">Event ID</th>
                <th className="py-2 pr-3 font-heading font-normal">Type</th>
                <th className="py-2 pr-3 font-heading font-normal">Webhook</th>
                <th className="py-2 font-heading font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((d) => (
                <tr key={d._id} className="border-b border-dashed border-pencil/20">
                  <td className="py-2 pr-3 whitespace-nowrap text-pencil/70 text-xs">{fmtDate(d.createdAt)}</td>
                  <td className="py-2 pr-3">
                    <button onClick={() => setDetailId(d._id)} className="text-ink hover:underline font-mono text-xs break-all">
                      {d.eventId.slice(0, 12)}…
                    </button>
                  </td>
                  <td className="py-2 pr-3 text-pencil/80">{d.event}</td>
                  <td className="py-2 pr-3 text-pencil/70">{d.webhook?.name || '—'}</td>
                  <td className="py-2"><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} pages={data.pages} onChange={setPage} />

      {detailId && <DeliveryPanel id={detailId} onClose={() => setDetailId(null)} />}
    </Card>
  );
};

// --- Full-page add/edit view ----------------------------------------------

export const WebhookFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = !!id;
  const [events, setEvents] = useState([]);
  const [hook, setHook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const reqs = [webhooksApi.listEvents()];
        if (editing) reqs.push(webhooksApi.getOne(id));
        const [evRes, hookRes] = await Promise.all(reqs);
        setEvents(evRes.data.data.events);
        if (editing) setHook(hookRes.data.data.webhook);
      } catch {
        navigate('/settings/webhooks');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const back = () => navigate('/settings/webhooks');

  if (loading) return <Spinner />;
  if (editing && !hook) return null;

  return (
    <div className="space-y-6">
      <button onClick={back} className="flex items-center gap-1 font-body text-sm text-pencil/60 hover:text-pencil transition-colors">
        <ChevronLeft size={16} strokeWidth={2.5} /> Back to webhooks
      </button>
      <div className="space-y-1">
        <h1 className="font-heading text-3xl text-pencil flex items-center gap-2">
          <WebhookIcon size={26} strokeWidth={2.5} className="text-accent" />
          {editing ? 'Edit webhook' : 'Add webhook'}
        </h1>
        <p className="font-body text-pencil/60">
          {editing
            ? 'Update this endpoint and the events it receives.'
            : 'Register an endpoint and choose which events to send.'}
        </p>
      </div>
      <Card>
        <WebhookForm events={events} initial={editing ? hook : null} onSaved={back} onCancel={back} />
      </Card>
    </div>
  );
};

// --- Page -----------------------------------------------------------------

export const WebhookSettings = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('hooks');
  const [events, setEvents] = useState([]);
  const [hooks, setHooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [evRes, hookRes] = await Promise.all([webhooksApi.listEvents(), webhooksApi.list()]);
        setEvents(evRes.data.data.events);
        setHooks(hookRes.data.data.webhooks);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner />;

  const tabCls = (t) =>
    [
      'px-4 py-2 font-heading text-sm border-b-[3px] -mb-[3px] transition-colors',
      tab === t ? 'border-accent text-pencil' : 'border-transparent text-pencil/50 hover:text-pencil',
    ].join(' ');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl text-pencil flex items-center gap-2">
          <WebhookIcon size={26} strokeWidth={2.5} className="text-accent" />
          Webhooks
        </h1>
        <p className="font-body text-pencil/60">
          Get a POST to your URL when something happens on your account. Each payload is signed (HMAC-SHA256).
        </p>
      </div>

      <div className="flex items-end justify-between gap-3 border-b-[3px] border-pencil/20">
        <div className="flex gap-2">
          <button className={tabCls('hooks')} onClick={() => setTab('hooks')}>Webhooks</button>
          <button className={tabCls('events')} onClick={() => setTab('events')}>Webhook Events</button>
        </div>
        {/* Reserve the button's space on both tabs so the bar height doesn't jump. */}
        <Button
          size="sm"
          onClick={() => navigate('/settings/webhooks/new')}
          className={`flex items-center gap-1.5 mb-2 shrink-0 ${tab === 'hooks' ? '' : 'invisible'}`}
        >
          <Plus size={15} strokeWidth={2.5} /> Add Webhook
        </Button>
      </div>

      {tab === 'hooks'
        ? <WebhooksTab events={events} hooks={hooks} setHooks={setHooks} onEdit={(hook) => navigate(`/settings/webhooks/${hook.id}/edit`)} />
        : <EventsTab events={events} hooks={hooks} />}
    </div>
  );
};
