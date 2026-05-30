import React, { useState, useRef, useEffect } from 'react';
import { Eye, Pencil, Columns2 } from 'lucide-react';
import { renderContent, htmlToMarkdown, PROSE_CLASS } from '../../lib/content.js';

const VIEWS = [
  { key: 'write', label: 'Write', icon: Pencil },
  { key: 'split', label: 'Split', icon: Columns2 },
  { key: 'preview', label: 'Preview', icon: Eye },
];

const ViewTab = ({ active, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'flex items-center gap-1 px-3 py-1.5 text-sm font-body border-2 border-transparent transition-all duration-100 rounded',
      active ? 'bg-pencil text-paper' : 'text-pencil hover:bg-muted',
    ].join(' ')}
  >
    <Icon size={14} strokeWidth={2.5} />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export const MarkdownEditor = ({ content, onChange }) => {
  const [view, setView] = useState('split');
  const previewRef = useRef(null);

  const showEditor = view === 'write' || view === 'split';
  const showPreview = view === 'preview' || view === 'split';

  // Keep the editable preview in sync with the markdown source — but never
  // while the user is actively editing it (that would reset the caret).
  useEffect(() => {
    const el = previewRef.current;
    if (!el || document.activeElement === el) return;
    const html = renderContent(content, 'markdown');
    if (el.innerHTML !== html) el.innerHTML = html;
  }, [content, view]);

  // When the user edits the preview, convert its HTML back to markdown.
  const syncFromPreview = () => {
    if (!previewRef.current) return;
    const md = htmlToMarkdown(previewRef.current.innerHTML);
    if (md !== content) onChange(md);
  };

  return (
    <div className="border-2 border-pencil shadow-hard wobbly-md overflow-hidden">
      <div className="flex items-center gap-1 px-4 py-3 border-b-2 border-dashed border-pencil bg-muted/30">
        {VIEWS.map((v) => (
          <ViewTab
            key={v.key}
            active={view === v.key}
            onClick={() => setView(v.key)}
            icon={v.icon}
            label={v.label}
          />
        ))}
        <span className="ml-auto font-body text-xs text-pencil/50">
          Markdown · preview is editable
        </span>
      </div>

      <div className={['min-h-[400px]', view === 'split' ? 'grid md:grid-cols-2' : ''].join(' ')}>
        {showEditor && (
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={'# Write in Markdown\n\nUse **bold**, _italic_, `code`, lists, tables, > quotes...'}
            spellCheck="false"
            className="w-full min-h-[400px] p-4 font-mono text-sm bg-white text-pencil
                       resize-none focus:outline-none border-pencil
                       placeholder:text-pencil/30
                       [&:not(:only-child)]:border-r-2 [&:not(:only-child)]:border-dashed"
          />
        )}
        {showPreview && (
          <div
            ref={previewRef}
            contentEditable
            suppressContentEditableWarning
            onInput={syncFromPreview}
            onBlur={syncFromPreview}
            role="textbox"
            aria-multiline="true"
            aria-label="Editable preview"
            className={[
              PROSE_CLASS,
              'p-4 overflow-auto min-h-[400px] bg-paper/40 focus:outline-none focus:bg-white',
            ].join(' ')}
          />
        )}
      </div>
    </div>
  );
};
