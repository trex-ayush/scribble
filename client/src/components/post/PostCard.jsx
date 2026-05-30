import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag } from 'lucide-react';

const BORDER_RADII = [
  '255px 15px 225px 15px / 15px 225px 15px 255px',
  '15px 255px 15px 225px / 225px 15px 255px 15px',
  '225px 25px 255px 25px / 25px 255px 25px 225px',
];
const ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-[0.5deg]', 'rotate-[0.5deg]', 'rotate-0'];

export const PostCard = ({ post, index = 0 }) => {
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const radius = BORDER_RADII[index % BORDER_RADII.length];

  return (
    <article
      className={`relative bg-white border-2 border-pencil shadow-hard p-6
        hover:shadow-hard-lg hover:${rotation} transition-all duration-100 group`}
      style={{ borderRadius: radius }}
    >
      <Link to={`/post/${post.slug}`} className="block space-y-3">
        <h2 className="font-heading text-xl text-pencil group-hover:text-accent transition-colors leading-tight">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="font-body text-pencil/70 text-sm leading-relaxed line-clamp-2">
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
