import { marked } from 'marked';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

marked.setOptions({ gfm: true, breaks: true });

// marked v12 dropped automatic heading ids; re-add GitHub-style slugs so in-page
// anchor links (a table of contents / "Index") have a target to scroll to.
const slugifyHeading = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // drop punctuation (em/en dashes, &, etc.) — keep word chars, spaces, hyphens
    .replace(/\s/g, '-'); // each space -> hyphen (repeats kept, e.g. "a — b" -> "a--b")

// Add ids to headings that lack them, deduping like GitHub (foo, foo-1, foo-2).
const addHeadingIds = (html) => {
  if (!html || typeof DOMParser === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const seen = Object.create(null);
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (h.id) return;
    const base = slugifyHeading(h.textContent || '');
    if (!base) return;
    if (base in seen) {
      seen[base] += 1;
      h.id = `${base}-${seen[base]}`;
    } else {
      seen[base] = 0;
      h.id = base;
    }
  });
  return doc.body.innerHTML;
};

// Single shared HTML -> Markdown converter (GFM: tables, strikethrough, etc.)
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});
turndown.use(gfm);

/**
 * Convert (sanitized) HTML back into Markdown.
 * Used so the live preview can be edited and synced back to the source.
 * @param {string} html
 * @returns {string} markdown
 */
export const htmlToMarkdown = (html) => {
  if (!html) return '';
  return turndown.turndown(DOMPurify.sanitize(html)).trim();
};

/**
 * Convert stored post content into safe HTML for rendering.
 * - 'markdown' content is parsed to HTML via marked.
 * - 'html' content (from the rich-text editor) is used as-is.
 * Both are then sanitized with DOMPurify, then headings get anchor ids.
 *
 * @param {string} content raw stored content
 * @param {'html'|'markdown'} [format='html']
 * @returns {string} sanitized HTML string
 */
export const renderContent = (content, format = 'html') => {
  if (!content) return '';
  const html = format === 'markdown' ? marked.parse(content) : content;
  return addHeadingIds(DOMPurify.sanitize(html));
};

/**
 * Shared prose styling so the reader view and the live preview look identical.
 * Tailwind arbitrary-variant selectors mirror the hand-drawn design system.
 */
export const PROSE_CLASS =
  'font-body text-pencil leading-relaxed space-y-4 max-w-full min-w-0 break-words [overflow-wrap:anywhere] ' +
  '[&_h1]:font-heading [&_h1]:text-3xl [&_h1]:mt-8 [&_h1]:mb-3 ' +
  '[&_h2]:font-heading [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-3 ' +
  '[&_h3]:font-heading [&_h3]:text-xl [&_h3]:mt-6 [&_h3]:mb-2 ' +
  // Offset for the sticky top bar so anchored headings aren't hidden under it.
  '[&_h1]:scroll-mt-24 [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24 [&_h4]:scroll-mt-24 [&_h5]:scroll-mt-24 [&_h6]:scroll-mt-24 ' +
  '[&_a]:text-ink [&_a]:underline [&_a]:break-words ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-pencil [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-pencil/70 ' +
  '[&_pre]:bg-pencil [&_pre]:text-paper [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:max-w-full ' +
  '[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm [&_code]:break-words ' +
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 ' +
  '[&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside ' +
  '[&_table]:w-full [&_table]:border-collapse [&_th]:border-2 [&_th]:border-pencil [&_th]:p-2 [&_td]:border [&_td]:border-pencil [&_td]:p-2 ' +
  '[&_img]:max-w-full [&_img]:border-2 [&_img]:border-pencil';
