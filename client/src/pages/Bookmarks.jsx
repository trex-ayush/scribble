import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, PenLine } from 'lucide-react';
import { bookmarksApi } from '../api/bookmarks.js';
import { PostCard } from '../components/post/PostCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';

const PER_PAGE_OPTIONS = [10, 20, 30, 50];

const SkeletonCard = () => (
  <div
    className="h-44 bg-muted animate-pulse border-2 border-pencil shadow-hard"
    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
  />
);

export const Bookmarks = () => {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    bookmarksApi
      .list({ page, limit: perPage })
      .then(({ data }) => {
        if (!active) return;
        setPosts(data.data.posts);
        setPagination({ page: data.data.page, pages: data.data.pages, total: data.data.total });
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [page, perPage]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b-2 border-dashed border-pencil pb-3">
        <Bookmark size={26} strokeWidth={2.5} className="text-accent" />
        <h1 className="font-heading text-3xl text-pencil">Reading list</h1>
        {pagination.total > 0 && (
          <span className="font-body text-sm text-pencil/50">({pagination.total})</span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <p className="font-heading text-3xl text-pencil">Your reading list is empty</p>
          <p className="font-body text-pencil/60">
            Tap the bookmark icon on any story to save it here for later.
          </p>
          <Link to="/">
            <Button className="inline-flex items-center gap-2">
              <PenLine size={18} strokeWidth={2.5} />
              Browse stories
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post, i) => <PostCard key={post._id} post={post} index={i} />)}
          </div>
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            perPage={perPage}
            perPageOptions={PER_PAGE_OPTIONS}
            onChange={setPage}
            onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
          />
        </>
      )}
    </div>
  );
};
