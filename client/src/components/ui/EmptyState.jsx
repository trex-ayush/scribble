import React from 'react';

// Subtle, slightly-irregular radius so the note reads as a sheet of paper, not
// a blobby oval. (The reference's sticky notes use ~7px, not the big wobble.)
const NOTE_RADIUS = '14px 10px 16px 11px / 11px 16px 10px 14px';

// Hand-drawn "pinned note" empty state: a taped paper card (stacked on a second
// sheet for depth) with a rough-circle icon, a scrawled label, heading, squiggle
// underline, note, and an action — plus a doodle arrow nudging toward it. Reused
// for empty feeds, filtered views, and no-result searches. Doodles hide on small
// screens so the note stays the focus.
export const EmptyState = ({ icon: Icon, label, title, message, action }) => (
  <div className="flex items-center justify-center min-h-[46vh] py-12 px-4">
    <div className="relative w-full max-w-md">
      {/* doodles anchored to the note (not stranded in the page corners) */}
      <span
        aria-hidden="true"
        className="pointer-events-none hidden md:block absolute -left-10 -top-9 w-14 h-14 border-[3px] border-dashed border-ink/50 rounded-full animate-float"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none hidden md:block absolute -right-8 -bottom-6"
        style={{
          width: 0,
          height: 0,
          borderLeft: '16px solid transparent',
          borderRight: '16px solid transparent',
          borderBottom: '28px solid #ffb3c1',
          transform: 'rotate(18deg)',
        }}
      />

      {/* the note */}
      <div
        className="relative bg-white border-2 border-pencil shadow-hard-lg px-8 pt-10 pb-8 text-center -rotate-1 overflow-hidden"
        style={{ borderRadius: NOTE_RADIUS }}
      >
        {/* folded dog-ear corner */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-0"
          style={{
            width: 0,
            height: 0,
            borderLeft: '26px solid transparent',
            borderTop: '26px solid #e5e0d8',
          }}
        />

        {Icon && (
          <div
            className="mx-auto mb-4 flex items-center justify-center w-20 h-20 bg-highlight border-2 border-pencil text-pencil shadow-hard -rotate-3"
            style={{ borderRadius: '48% 52% 55% 45% / 55% 46% 54% 45%' }}
          >
            <Icon size={34} strokeWidth={2.5} />
          </div>
        )}

        {label && <p className="font-body text-sm text-accent -rotate-2 mb-1">~ {label} ~</p>}

        <h2 className="font-heading text-3xl sm:text-4xl text-pencil leading-tight break-words">
          {title}
        </h2>

        {/* hand-drawn squiggle underline */}
        <svg
          aria-hidden="true"
          className="mx-auto mt-2 mb-3"
          width="150"
          height="12"
          viewBox="0 0 150 12"
          fill="none"
        >
          <path
            d="M3 7 C 30 1, 45 11, 72 6 S 120 1, 147 6"
            stroke="#ff4d4d"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        {message && (
          <p className="font-body text-base text-pencil/60 max-w-xs mx-auto">{message}</p>
        )}

        {action && (
          <div className="relative mt-6 flex justify-center">
            {/* doodle arrow nudging toward the action */}
            <svg
              aria-hidden="true"
              className="pointer-events-none hidden md:block absolute -left-2 -top-5 -rotate-6"
              width="56"
              height="40"
              viewBox="0 0 56 40"
              fill="none"
            >
              <path
                d="M4 6 C 16 2, 40 6, 46 30"
                stroke="#2d5da1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="2 7"
              />
              <path
                d="M46 30 L38 24 M46 30 L52 22"
                stroke="#2d5da1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {action}
          </div>
        )}
      </div>

      {/* tape — a sibling of the note so the card's overflow-hidden doesn't clip
          the part that sticks out above the top edge */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-10 w-28 h-7 bg-highlight/70"
        style={{
          transform: 'translate(-50%, -55%) rotate(-5deg)',
          borderLeft: '1px dashed rgba(0,0,0,.2)',
          borderRight: '1px dashed rgba(0,0,0,.2)',
          boxShadow: '0 2px 5px rgba(0,0,0,.1)',
        }}
      />
    </div>
  </div>
);
