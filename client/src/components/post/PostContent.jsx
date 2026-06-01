import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { renderContent, PROSE_CLASS } from '../../lib/content.js';

// Collapse to comparable form so a TOC link matches its heading regardless of
// how punctuation/spacing was slugified.
const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// Inline link icon (lucide "link") appended to headings as a copy-link control.
const LINK_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

/**
 * Renders a post's body (html or markdown) as sanitized, styled HTML.
 * Shared by the reader (PostDetail) and the Markdown live preview (DRY).
 * In-page anchor links scroll to the matching heading (by id, else by text).
 * When `headingLinks` is set, each heading gets a hover "copy link" control.
 */
export const PostContent = ({ content, format = 'html', className = '', headingLinks = false, onCopyHeading }) => {
  const html = useMemo(() => renderContent(content, format), [content, format]);
  const ref = useRef(null);

  const findTarget = useCallback((fragment) => {
    const root = ref.current;
    if (!root || !fragment) return null;
    try {
      const byId = root.querySelector(`#${CSS.escape(fragment)}`);
      if (byId) return byId;
    } catch {
      /* invalid selector — fall through to text match */
    }
    const want = normalize(fragment);
    if (!want) return null;
    return (
      [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')].find(
        (h) => normalize(h.textContent) === want
      ) || null
    );
  }, []);

  const handleClick = useCallback(
    (e) => {
      // Copy-link control on a heading.
      const copyBtn = e.target.closest('[data-heading-copy]');
      if (copyBtn && ref.current?.contains(copyBtn)) {
        e.preventDefault();
        const id = copyBtn.getAttribute('data-heading-copy');
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        navigator.clipboard?.writeText(url).catch(() => {});
        onCopyHeading?.(url);
        return;
      }
      // In-page anchor link (TOC / "Index").
      const link = e.target.closest('a[href^="#"]');
      if (!link || !ref.current?.contains(link)) return;
      const target = findTarget(decodeURIComponent(link.getAttribute('href').slice(1)));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (target.id) window.history.replaceState(null, '', `#${target.id}`);
    },
    [findTarget, onCopyHeading]
  );

  // Append a hover copy-link button to each heading.
  useEffect(() => {
    if (!headingLinks || !ref.current) return;
    ref.current.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      if (!h.id || h.querySelector('[data-heading-copy]')) return;
      h.classList.add('group');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.headingCopy = h.id;
      btn.setAttribute('aria-label', 'Copy link to this section');
      btn.className =
        'heading-copy ml-2 align-middle inline-flex text-pencil/30 hover:text-accent ' +
        'opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-100';
      btn.innerHTML = LINK_ICON_SVG;
      h.appendChild(btn);
    });
  }, [html, headingLinks]);

  // Wrap wide tables so they scroll inside the column instead of widening the page.
  useEffect(() => {
    if (!ref.current) return;
    ref.current.querySelectorAll('table').forEach((t) => {
      if (t.parentElement?.classList.contains('table-scroll')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-scroll overflow-x-auto max-w-full';
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });
  }, [html]);

  // Deep link: if the page opens with a hash, smooth-scroll to the heading once
  // content is rendered (small delay lets layout settle for a clean animation).
  useEffect(() => {
    const fragment = decodeURIComponent(window.location.hash.slice(1));
    if (!fragment) return;
    const target = findTarget(fragment);
    if (!target) return;
    const t = setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => clearTimeout(t);
  }, [html, findTarget]);

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={[PROSE_CLASS, className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
