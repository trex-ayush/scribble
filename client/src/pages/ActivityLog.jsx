import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { activityApi } from '../api/activity.js';
import { Pagination } from '../components/ui/Pagination.jsx';
import { EventDataPanel } from '../components/activity/EventDataPanel.jsx';

const ACTION_STYLES = {
  Created: 'bg-ink/10 text-ink border-ink',
  Updated: 'bg-postit text-pencil border-pencil',
  Deleted: 'bg-accent/10 text-accent border-accent',
  Accessed: 'bg-muted text-pencil/70 border-pencil/40',
};

const ActionBadge = ({ action }) => (
  <span
    className={[
      'inline-block px-2 py-0.5 text-xs font-body border wobbly-tag',
      ACTION_STYLES[action] || 'bg-muted text-pencil border-pencil',
    ].join(' ')}
  >
    {action}
  </span>
);

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const ActivityLog = () => {
  const [data, setData] = useState({ logs: [], page: 1, pages: 1, total: 0, perPage: 15 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await activityApi.getLogs(page, perPage);
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page, perPage]);

  const handlePerPage = (n) => {
    setPerPage(n);
    setPage(1); // reset to first page when page size changes
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl text-pencil flex items-center gap-2">
          <Activity size={26} strokeWidth={2.5} className="text-accent" />
          Activity Log
        </h1>
        <p className="font-body text-pencil/60">
          A record of all notable actions on your account.
        </p>
      </div>

      <div
        className="bg-white border-2 border-pencil shadow-hard overflow-hidden"
        style={{ borderRadius: '15px 255px 15px 225px / 225px 15px 255px 15px' }}
      >
        {/* Header row */}
        <div className="hidden md:grid grid-cols-[1.4fr_1.6fr_1.2fr_1fr_1.4fr] gap-4 px-6 py-3 border-b-2 border-dashed border-pencil bg-muted/30 font-heading text-sm text-pencil/70">
          <span>DATE / TIME</span>
          <span>ACTOR</span>
          <span>EVENT SOURCE</span>
          <span>ACTION</span>
          <span>EVENT DATA</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-pencil border-t-accent rounded-full animate-spin" />
          </div>
        ) : data.logs.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="font-heading text-2xl text-pencil">No activity yet</p>
            <p className="font-body text-pencil/60">Your actions will appear here as you use Scribble.</p>
          </div>
        ) : (
          data.logs.map((log) => (
            <div
              key={log._id}
              className="grid grid-cols-1 md:grid-cols-[1.4fr_1.6fr_1.2fr_1fr_1.4fr] gap-2 md:gap-4 px-6 py-4 border-b border-dashed border-pencil/30 last:border-0 font-body text-sm"
            >
              <span className="text-pencil/80">{formatDate(log.createdAt)}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-pencil truncate">{log.actorName || 'You'}</span>
                  {log.viaTeam && (
                    <span className="shrink-0 px-1.5 text-[10px] font-body bg-postit text-pencil border border-pencil/40 rounded">
                      team
                    </span>
                  )}
                </span>
                <span className="block text-pencil/50 text-xs truncate">{log.actorEmail}</span>
              </span>
              <span className="min-w-0">
                <span className="block text-pencil/80">{log.source}</span>
                <span
                  className={[
                    'inline-block px-1.5 text-[10px] font-body border rounded',
                    log.origin === 'API'
                      ? 'bg-ink/10 text-ink border-ink/40'
                      : 'bg-muted text-pencil/60 border-pencil/30',
                  ].join(' ')}
                >
                  {log.origin === 'API' ? 'API' : 'App'}
                </span>
              </span>
              <span><ActionBadge action={log.action} /></span>
              <button
                onClick={() => setSelected(log)}
                className="text-ink hover:underline truncate text-left"
                title="View event data"
              >
                {log.eventData || '—'}
              </button>
            </div>
          ))
        )}
      </div>

      <Pagination
        page={page}
        pages={data.pages}
        total={data.total}
        perPage={perPage}
        onChange={setPage}
        onPerPageChange={handlePerPage}
      />

      {selected && <EventDataPanel log={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};
