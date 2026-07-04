import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// "subscription_create" / "createdAt" -> "Subscription Create"
const humanize = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const PrimitiveValue = ({ value }) => {
  if (value === null || value === undefined || value === '')
    return <span className="text-pencil/50">—</span>;
  if (typeof value === 'boolean') return <span>{String(value)}</span>;
  if (typeof value === 'string')
    return <span className="break-all">{ISO_DATE_RE.test(value) ? formatDate(value) : value}</span>;
  return <span className="break-all">{String(value)}</span>;
};

// Nested object → its own bordered sub-box with a two-col grid inside
const SubBox = ({ obj }) => (
  <div className="mt-1 border border-dashed border-pencil/40 rounded-lg px-3 py-2 space-y-1 bg-muted/20">
    {Object.entries(obj).map(([k, v]) => (
      <Row key={k} label={k} value={v} />
    ))}
  </div>
);

// Single row: primitive → inline value; object/array → sub-box below label
const Row = ({ label, value }) => {
  if (isObject(value)) {
    return (
      <div className="py-1">
        <span className="font-body text-sm font-semibold text-pencil">{humanize(label)}</span>
        <SubBox obj={value} />
      </div>
    );
  }
  if (Array.isArray(value)) {
    const allPrimitive = value.every((item) => !isObject(item));
    return (
      <div className="py-1">
        <span className="font-body text-sm font-semibold text-pencil">{humanize(label)}</span>
        {allPrimitive ? (
          <span className="ml-2 font-body text-sm text-pencil/80">{value.length ? value.join(', ') : '—'}</span>
        ) : (
          <div className="mt-1 space-y-1">
            {value.map((item, i) => (
              <SubBox key={i} obj={isObject(item) ? item : { value: item }} />
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-baseline justify-between gap-4 py-1 border-b border-dashed border-pencil/15 last:border-0">
      <span className="font-body text-sm text-pencil shrink-0">{humanize(label)}</span>
      <span className="font-body text-sm text-pencil/70 text-right">
        <PrimitiveValue value={value} />
      </span>
    </div>
  );
};

const SimpleObject = ({ obj }) => (
  <div className="space-y-1">
    {Object.entries(obj).map(([key, value]) => (
      <Row key={key} label={key} value={value} />
    ))}
  </div>
);

/**
 * Bordered "Event Data" box with a copy button and a Simple/Raw-JSON toggle.
 * Shared by the Activity Log drawer and the Webhook delivery drawer so both
 * render structured event payloads identically.
 */
export const EventDataBox = ({ data, title = 'Event Data' }) => {
  const [simple, setSimple] = useState(true);
  const [copied, setCopied] = useState(false);
  const hasData = data && typeof data === 'object' && Object.keys(data).length > 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data ?? {}, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div
      className="bg-white border-2 border-pencil shadow-hard overflow-hidden"
      style={{ borderRadius: '15px 255px 15px 225px / 225px 15px 255px 15px' }}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b-2 border-dashed border-pencil bg-muted/30">
        <h3 className="font-heading text-lg text-pencil flex items-center gap-2">
          {title}
          <button onClick={handleCopy} className="text-pencil/50 hover:text-ink transition-colors" aria-label={`Copy ${title}`}>
            {copied ? <Check size={15} strokeWidth={2.5} className="text-ink" /> : <Copy size={15} strokeWidth={2.5} />}
          </button>
        </h3>
        <label className="flex items-center gap-2 font-body text-sm text-pencil cursor-pointer select-none">
          Simple Format
          <span className="relative inline-block w-10 h-5">
            <input type="checkbox" checked={simple} onChange={(e) => setSimple(e.target.checked)} className="peer sr-only" />
            <span className="absolute inset-0 bg-muted border-2 border-pencil rounded-full peer-checked:bg-ink transition-colors" />
            <span className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white border border-pencil rounded-full transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
      </div>

      <div className="p-5">
        {!hasData ? (
          <p className="font-body text-pencil/50">No event data available.</p>
        ) : simple ? (
          <SimpleObject obj={data} />
        ) : (
          <pre className="font-mono text-sm text-pencil bg-muted/40 p-4 rounded overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
