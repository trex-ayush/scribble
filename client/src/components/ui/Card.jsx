import React from 'react';

const Tape = () => (
  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-pencil/10 border border-pencil/20 rotate-1 z-10" />
);

const Tack = () => (
  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-accent border-2 border-pencil z-10" />
);

const DECORATIONS = { tape: Tape, tack: Tack };

export const Card = ({ children, className = '', decoration, postit = false, ...props }) => {
  const Decoration = decoration ? DECORATIONS[decoration] : null;
  return (
    <div className="relative">
      {Decoration && <Decoration />}
      <div
        className={['card', postit ? 'bg-postit' : 'bg-white', className].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};
