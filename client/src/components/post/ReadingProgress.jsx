import React, { useEffect, useState } from 'react';

// Thin reading-progress bar pinned to the very top of the viewport.
// Fills left->right as the reader scrolls through `targetRef` (the article
// body). Reaches 100% when the bottom of the target meets the bottom of the
// viewport, i.e. when the article has been read through.
export const ReadingProgress = ({ targetRef }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = targetRef?.current;
      const viewport = window.innerHeight;
      const start = el ? el.offsetTop : 0;
      const end = el ? el.offsetTop + el.offsetHeight : document.documentElement.scrollHeight;
      const scrollable = end - start - viewport;
      if (scrollable <= 0) {
        setProgress(window.scrollY > start ? 100 : 0);
        return;
      }
      const pct = ((window.scrollY - start) / scrollable) * 100;
      setProgress(Math.min(100, Math.max(0, pct)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [targetRef]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-1.5 pointer-events-none"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-accent border-b-2 border-pencil transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
