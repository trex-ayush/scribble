import React, { useState, useEffect, useRef } from 'react';
import { X, Tag } from 'lucide-react';
import { postsApi } from '../../api/posts.js';

const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 30;
const normalize = (t) => t.trim().toLowerCase();

export const TagInput = ({ tags, onChange }) => {
  const [input, setInput] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);

  // Existing tags for autocomplete suggestions.
  useEffect(() => {
    postsApi.getTags().then(({ data }) => setAllTags(data.data.tags)).catch(() => {});
  }, []);

  // Close the suggestion dropdown when clicking outside.
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const atMax = tags.length >= MAX_TAGS;

  const addTag = (raw) => {
    const tag = normalize(raw);
    setInput('');
    if (!tag || tag.length > MAX_TAG_LENGTH) return;
    if (tags.includes(tag) || tags.length >= MAX_TAGS) return;
    onChange([...tags, tag]);
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  // Only suggest once the user has typed something.
  const query = normalize(input);
  const suggestions = query
    ? allTags.filter((t) => !tags.includes(t) && t.includes(query)).slice(0, 6)
    : [];

  const handleChange = (e) => {
    const val = e.target.value;
    // Comma anywhere commits the preceding text as chip(s).
    if (val.includes(',')) {
      const parts = val.split(',');
      parts.slice(0, -1).forEach(addTag);
      setInput(parts[parts.length - 1].trimStart());
    } else {
      setInput(val);
    }
    setOpen(true);
    setActive(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (open && suggestions[active]) addTag(suggestions[active]);
      else addTag(input);
    } else if (e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault();
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center justify-between mb-1">
        <label className="font-heading text-sm text-pencil">Tags</label>
        <span className="font-body text-xs text-pencil/50">{tags.length}/{MAX_TAGS}</span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 w-full px-3 py-2 bg-white border-2 border-pencil wobbly
                   focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/20 transition-all duration-100 min-h-[3rem]"
        onClick={() => wrapRef.current?.querySelector('input')?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-1 bg-muted border border-pencil text-sm font-body wobbly-tag"
          >
            <Tag size={11} strokeWidth={2.5} />
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-pencil/50 hover:text-accent transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X size={13} strokeWidth={3} />
            </button>
          </span>
        ))}

        {!atMax && (
          <input
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={tags.length ? 'Add another...' : 'Add a tag and press Enter...'}
            className="flex-1 min-w-[140px] bg-transparent font-body text-sm py-1 focus:outline-none placeholder:text-pencil/40"
          />
        )}
      </div>

      {atMax && (
        <p className="font-body text-xs text-pencil/50 mt-1">Maximum {MAX_TAGS} tags reached.</p>
      )}

      {open && !atMax && suggestions.length > 0 && (
        <ul
          className="absolute z-20 mt-1 w-full max-w-xs bg-white border-2 border-pencil shadow-hard overflow-hidden"
          style={{ borderRadius: '12px 5px 12px 5px / 5px 12px 5px 12px' }}
        >

          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => addTag(s)}
                className={[
                  'flex items-center gap-2 w-full text-left px-3 py-2 font-body text-sm transition-colors',
                  i === active ? 'bg-muted' : 'hover:bg-muted/60',
                ].join(' ')}
              >
                <Tag size={12} strokeWidth={2.5} className="text-pencil/50" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
