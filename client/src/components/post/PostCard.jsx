import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag, Star } from 'lucide-react';

const BORDER_RADII = [
  '255px 15px 225px 15px / 15px 225px 15px 255px',
  '15px 255px 15px 225px / 225px 15px 255px 15px',
  '225px 25px 255px 25px / 25px 255px 25px 225px',
];

// `isOwn` flags a post by the current user: red accent card + a post-it
// "Your story" tag in the corner.
export const PostCard = ({ post, index = 0, isOwn = false }) => {
  const radius = BORDER_RADII[index % BORDER_RADII.length];

  return (
    <article
      className="relative bg-white border-2 border-pencil shadow-hard p-6 transition-all duration-100 group hover:shadow-hard-lg"
      style={{ borderRadius: radius }}
    >
      {isOwn && (
        <span className="absolute -top-3 right-4 z-10 flex items-center gap-1 px-2 py-0.5 bg-postit border-2 border-pencil text-[11px] font-body text-pencil rotate-3 shadow-hard-sm wobbly-tag">
          <Star size={10} strokeWidth={2.5} className="text-accent" fill="currentColor" />
          Your story
        </span>
      )}

      <Link to={`/post/${post.slug}`} className="block space-y-3">
        <h2 className="font-heading text-xl text-pencil group-hover:text-accent transition-colors leading-tight break-words">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="font-body text-pencil/70 text-sm leading-relaxed line-clamp-2 break-words">
            {post.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-pencil/60 text-sm font-body">
          <Link
            to={`/@${post.author?.username}`}
            className="hover:text-accent transition-colors font-medium text-pencil"
            onClick={(e) => e.stopPropagation()}
          >
            {post.author?.name || post.author?.username}
          </Link>
          <span className="flex items-center gap-1">
            <Clock size={12} strokeWidth={2.5} />
            {post.readingTime} min read
          </span>
          {post.status === 'draft' && (
            <span className="px-2 py-0.5 bg-postit border border-pencil text-xs wobbly-tag">
              Draft
            </span>
          )}
        </div>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-1 bg-muted border border-pencil text-xs font-body wobbly-tag"
              >
                <Tag size={10} strokeWidth={2.5} />
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </article>
  );
};
