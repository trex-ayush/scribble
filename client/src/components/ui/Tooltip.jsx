import React, { useState, useRef, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';

const GAP = 8;

// Anchor point + transform for each placement, computed from the trigger's
// viewport rect (the bubble is portaled to <body> with position: fixed).
const place = (r, position) => {
  switch (position) {
    case 'bottom':
      return { top: r.bottom + GAP, left: r.left + r.width / 2, transform: 'translate(-50%, 0)' };
    case 'left':
      return { top: r.top + r.height / 2, left: r.left - GAP, transform: 'translate(-100%, -50%)' };
    case 'right':
      return { top: r.top + r.height / 2, left: r.right + GAP, transform: 'translate(0, -50%)' };
    case 'top':
    default:
      return { top: r.top - GAP, left: r.left + r.width / 2, transform: 'translate(-50%, -100%)' };
  }
};

/**
 * Hand-drawn tooltip (skill.md design system). Renders the bubble in a portal
 * at <body> so it is never clipped by an ancestor's `overflow-hidden` or
 * trapped in a `transform` stacking context. Wrap any element:
 *   <Tooltip label="Unique viewers"><Eye /></Tooltip>
 */
export const Tooltip = ({ label, position = 'top', children, className = '' }) => {
  const [coords, setCoords] = useState(null);
  const ref = useRef(null);
  const id = useId();

  const show = useCallback(() => {
    if (ref.current) setCoords(place(ref.current.getBoundingClientRect(), position));
  }, [position]);
  const hide = useCallback(() => setCoords(null), []);

  if (!label) return children;

  return (
    <span
      ref={ref}
      className={`relative inline-flex ${className}`}
      tabIndex={0}
      aria-describedby={coords ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {coords &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            className="fixed z-[1000] pointer-events-none block w-max max-w-[15rem] whitespace-normal break-words text-center px-2.5 py-1.5 bg-pencil text-paper font-body text-xs leading-snug border-2 border-pencil shadow-hard-sm"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: coords.transform,
              borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px',
            }}
          >
            {label}
          </span>,
          document.body
        )}
    </span>
  );
};
