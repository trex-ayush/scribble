import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

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

const renderValue = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

export const EventDataPanel = ({ log, onClose }) => {
  const [simple, setSimple] = useState(true);
  const [copied, setCopied] = useState(false);

  const data = log?.payload && Object.keys(log.payload).length ? log.payload : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data ?? {}, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-pencil/40" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full bg-paper border-l-[3px] border-pencil shadow-hard-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-dashed border-pencil flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-heading text-2xl text-pencil">Activity Log</h2>
            <p className="font-body text-sm text-pencil/60">Event ID — {log.eventData || log._id}</p>
            <p className="font-body text-sm text-pencil/60">
              Action — {log.action} ({log.method})
            </p>
            <p className="font-body text-sm text-pencil/60">Executed At — {formatDate(log.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-pencil/60 hover:text-accent transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          <div
            className="bg-white border-2 border-pencil shadow-hard overflow-hidden"
            style={{ borderRadius: '15px 255px 15px 225px / 225px 15px 255px 15px' }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-dashed border-pencil bg-muted/30">
              <h3 className="font-heading text-lg text-pencil flex items-center gap-2">
                Event Data
                <button
                  onClick={handleCopy}
                  className="text-pencil/50 hover:text-ink transition-colors"
                  aria-label="Copy event data"
                >
                  {copied ? <Check size={15} strokeWidth={2.5} className="text-ink" /> : <Copy size={15} strokeWidth={2.5} />}
                </button>
              </h3>
              <label className="flex items-center gap-2 font-body text-sm text-pencil cursor-pointer select-none">
                Simple Format
                <span className="relative inline-block w-10 h-5">
                  <input
                    type="checkbox"
                    checked={simple}
                    onChange={(e) => setSimple(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 bg-muted border-2 border-pencil rounded-full peer-checked:bg-ink transition-colors" />
                  <span className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white border border-pencil rounded-full transition-transform peer-checked:translate-x-5" />
                </span>
              </label>
            </div>

            <div className="p-5">
              {!data ? (
                <p className="font-body text-pencil/50">No event data available.</p>
              ) : simple ? (
                <div className="divide-y divide-dashed divide-pencil/20">
                  {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[1fr_1.4fr] gap-4 py-2">
                      <span className="font-body text-pencil">{humanize(key)}</span>
                      <span className="font-body text-pencil/80 break-words">{renderValue(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="font-mono text-sm text-pencil bg-muted/40 p-4 rounded overflow-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
