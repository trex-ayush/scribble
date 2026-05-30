import React, { useMemo } from 'react';
import { renderContent, PROSE_CLASS } from '../../lib/content.js';

/**
 * Renders a post's body (html or markdown) as sanitized, styled HTML.
 * Shared by the reader (PostDetail) and the Markdown live preview (DRY).
 */
export const PostContent = ({ content, format = 'html', className = '' }) => {
  const html = useMemo(() => renderContent(content, format), [content, format]);

  return (
    <div
      className={[PROSE_CLASS, className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
