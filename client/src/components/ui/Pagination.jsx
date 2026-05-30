import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.jsx';

const DEFAULT_PER_PAGE_OPTIONS = [15, 20, 30, 50, 100];

/**
 * Reusable pager (Pabbly-style):
 *  - per-page selector
 *  - "Showing X – Y of N" summary
 *  - prev / jump-to-page input / next
 *
 * @param {number} page       current page (1-based)
 * @param {number} pages      total page count
 * @param {function} onChange called with the new page number
 * @param {number} [total]    total record count (for the summary)
 * @param {number} [perPage]  current page size
 * @param {function} [onPerPageChange] called with the new page size
 */
export const Pagination = ({
  page, pages, onChange, total, perPage, onPerPageChange,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
}) => {
  const [jump, setJump] = useState(String(page));

  // Keep the jump input in sync when the page changes elsewhere.
  useEffect(() => setJump(String(page)), [page]);

  const commitJump = () => {
    const n = parseInt(jump, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= pages && n !== page) onChange(n);
    else setJump(String(page)); // reset invalid input
  };

  const start = total != null && perPage ? (page - 1) * perPage + 1 : null;
  const end = total != null && perPage ? Math.min(page * perPage, total) : null;

  // Nothing to show at all.
  if (!total && pages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
      {/* Per-page + summary */}
      <div className="flex items-center gap-3">
        {onPerPageChange && (
          <div className="relative">
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(parseInt(e.target.value, 10))}
              className="appearance-none font-body text-sm pl-3 pr-8 py-1.5 bg-white border-2 border-pencil
                         focus:outline-none focus:border-ink cursor-pointer"
              style={{ borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' }}
              aria-label="Records per page"
            >
              {perPageOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <ChevronRight
              size={14}
              strokeWidth={2.5}
              className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-pencil/50 pointer-events-none"
            />
          </div>
        )}

        {total != null && (
          <span className="font-body text-sm text-pencil/60 whitespace-nowrap">
            {start != null
              ? `Showing ${start} – ${end} of ${total}`
              : `${total} records`}
          </span>
        )}
      </div>

      {/* Prev / jump / next */}
      {pages > 1 && (
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            className="!px-2"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </Button>

          <input
            type="text"
            inputMode="numeric"
            value={jump}
            onChange={(e) => setJump(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={commitJump}
            onKeyDown={(e) => e.key === 'Enter' && commitJump()}
            className="w-12 text-center font-body text-sm py-1.5 bg-white border-2 border-ink
                       focus:outline-none focus:ring-2 focus:ring-ink/20"
            style={{ borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' }}
            aria-label="Go to page"
          />

          <span className="font-body text-sm text-pencil/60 whitespace-nowrap">of {pages}</span>

          <Button
            size="sm"
            disabled={page >= pages}
            onClick={() => onChange(page + 1)}
            className="!px-2"
            aria-label="Next page"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </Button>
        </div>
      )}
    </div>
  );
};
