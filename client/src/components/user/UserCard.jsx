import React from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';

// Compact user card for search results and follower/following lists.
export const UserCard = ({ user }) => (
  <Link
    to={`/@${user.username}`}
    className="flex items-start gap-3 bg-white border-2 border-pencil shadow-hard p-4
               hover:shadow-hard-lg hover:-rotate-1 transition-all duration-100 wobbly-md"
  >
    <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-muted border-2 border-pencil rounded-full">
      <UserIcon size={18} strokeWidth={2.5} className="text-pencil" />
    </div>
    <div className="min-w-0">
      <p className="font-heading text-pencil truncate">{user.name || user.username}</p>
      <p className="font-body text-sm text-pencil/60 truncate">@{user.username}</p>
      {user.bio && (
        <p className="font-body text-sm text-pencil/70 line-clamp-2 mt-1">{user.bio}</p>
      )}
      {typeof user.followers?.length === 'number' && (
        <p className="font-body text-xs text-pencil/50 mt-1">
          {user.followers.length} {user.followers.length === 1 ? 'follower' : 'followers'}
        </p>
      )}
    </div>
  </Link>
);
