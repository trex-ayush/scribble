import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

/**
 * App-wide feedback: hand-drawn toasts + a promise-based confirm dialog,
 * replacing the native window.alert / window.confirm.
 *
 * Usage:
 *   const { toast, confirm } = useFeedback();
 *   toast.success('Saved!');
 *   if (await confirm({ title: 'Delete?', tone: 'danger' })) { ... }
 */
const FeedbackContext = createContext(null);

export const useFeedback = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within <FeedbackProvider>');
  return ctx;
};

const TOAST_STYLES = {
  success: { icon: CheckCircle2, bar: 'bg-ink', text: 'text-ink' },
  error: { icon: XCircle, bar: 'bg-accent', text: 'text-accent' },
  warning: { icon: AlertTriangle, bar: 'bg-pencil', text: 'text-pencil' },
  info: { icon: Info, bar: 'bg-ink', text: 'text-ink' },
};

const Toast = ({ toast, onClose }) => {
  const { icon: Icon, bar, text } = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  return (
    <div
      className="relative flex items-start gap-3 w-80 max-w-[90vw] bg-white border-2 border-pencil shadow-hard p-4 pr-8
                 animate-[slideIn_0.15s_ease-out]"
      style={{ borderRadius: '15px 255px 15px 225px / 225px 15px 255px 15px' }}
      role="status"
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${bar}`} />
      <Icon size={20} strokeWidth={2.5} className={`${text} shrink-0 mt-0.5`} />
      <div className="min-w-0">
        {toast.title && <p className="font-heading text-pencil leading-tight">{toast.title}</p>}
        {toast.message && <p className="font-body text-sm text-pencil/70 break-words">{toast.message}</p>}
      </div>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-pencil/40 hover:text-accent transition-colors"
        aria-label="Dismiss"
      >
        <X size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
};

const ConfirmDialog = ({ dialog, onResolve }) => {
  const danger = dialog.tone === 'danger';
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-pencil/40"
      onClick={() => onResolve(false)}
    >
      <div
        className="w-full max-w-sm bg-paper border-2 border-pencil shadow-hard-lg p-6 space-y-4 -rotate-1"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`shrink-0 w-10 h-10 flex items-center justify-center border-2 border-pencil rounded-full ${
              danger ? 'bg-accent/15 text-accent' : 'bg-postit text-pencil'
            }`}
          >
            <AlertTriangle size={20} strokeWidth={2.5} />
          </span>
          <div className="space-y-1">
            <h2 className="font-heading text-xl text-pencil">{dialog.title || 'Are you sure?'}</h2>
            {dialog.message && (
              <p className="font-body text-sm text-pencil/70">{dialog.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => onResolve(false)} className="btn-secondary btn-sm">
            {dialog.cancelText || 'Cancel'}
          </button>
          <button
            onClick={() => onResolve(true)}
            className={danger ? 'btn-danger btn-sm' : 'btn-primary btn-sm'}
          >
            {dialog.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

let idSeq = 0;

export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, titleOrOpts, maybeMessage) => {
      const opts =
        typeof titleOrOpts === 'string'
          ? { title: titleOrOpts, message: maybeMessage }
          : titleOrOpts;
      const id = ++idSeq;
      setToasts((prev) => [...prev, { id, type, ...opts }]);
      const duration = opts.duration ?? 3500;
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (t, m) => push('success', t, m),
    error: (t, m) => push('error', t, m),
    warning: (t, m) => push('warning', t, m),
    info: (t, m) => push('info', t, m),
  };

  const confirm = useCallback((opts = {}) => {
    setDialog(opts);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const resolveDialog = (value) => {
    setDialog(null);
    resolverRef.current?.(value);
    resolverRef.current = null;
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack */}
      <div className="fixed top-20 right-4 z-[90] flex flex-col gap-3">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>

      {dialog && <ConfirmDialog dialog={dialog} onResolve={resolveDialog} />}
    </FeedbackContext.Provider>
  );
};
