import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { EventDataBox } from './EventDataBox.jsx';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const EventDataPanel = ({ log, onClose }) => {
  const data = log?.payload && Object.keys(log.payload).length ? log.payload : null;

  return createPortal(
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
          <EventDataBox data={data} />
        </div>
      </div>
    </div>,
    document.body
  );
};
