import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PenLine, Tag, X, Users, FileText } from 'lucide-react';
import { postsApi } from '../api/posts.js';
import { usersApi } from '../api/users.js';
import { PostCard } from '../components/post/PostCard.jsx';
import { UserCard } from '../components/user/UserCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { useAuth } from '../hooks/useAuth.js';

const PER_PAGE_OPTIONS = [10, 20, 30, 50];

const MAX_TAGS = 7;
const MAX_PEOPLE = 6;
const DEFAULT_TAGS = ['react', 'javascript', 'design', 'career', 'ai', 'productivity', 'writing'];

// Show real (used) tags first; if fewer than MAX_TAGS, top up with defaults.
const mergeTags = (realTags = []) => {
  const fillers = DEFAULT_TAGS.filter((t) => !realTags.includes(t));
  return [...realTags, ...fillers].slice(0, MAX_TAGS);
};

const SkeletonCard = () => (
  <div
    className="h-44 bg-muted animate-pulse border-2 border-pencil shadow-hard"
    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
  />
);

export const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [people, setPeople] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState(DEFAULT_TAGS);

  const activeTag = searchParams.get('tag') || '';
  const activeSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('limit') || '10', 10);
  const searching = !!activeSearch;

  // Fetch stories, and — when searching — matching people to blend in.
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [feedRes, usersRes] = await Promise.all([
          postsApi.getFeed({
            page: currentPage,
            limit: perPage,
            tag: activeTag || undefined,
            search: activeSearch || undefined,
          }),
          searching ? usersApi.search(activeSearch) : Promise.resolve(null),
        ]);
        setPosts(feedRes.data.data.posts);
        setPagination({
          page: feedRes.data.data.page,
          pages: feedRes.data.data.pages,
          total: feedRes.data.data.total,
        });
        setPeople(usersRes ? usersRes.data.data.users : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [currentPage, perPage, activeTag, activeSearch, searching]);

  useEffect(() => {
    postsApi
      .getTags()
      .then(({ data }) => setTags(mergeTags(data.data.tags)))
      .catch(() => setTags(DEFAULT_TAGS));
  }, []);

  const handleTagClick = (tag) => {
    setSearchParams(tag === activeTag ? {} : { tag });
  };

  const handlePage = (newPage) => {
    const next = { ...Object.fromEntries(searchParams), page: newPage };
    setSearchParams(next);
  };

  const handlePerPage = (n) => {
    const next = { ...Object.fromEntries(searchParams), limit: n, page: 1 };
    setSearchParams(next);
  };

  const showHero = !isAuthenticated && !activeSearch && !activeTag;
  const showPeople = searching && people.length > 0;

  return (
    <div className="space-y-6">
      {showHero && (
        <section className="text-center py-16 space-y-6">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl text-pencil leading-tight">
            Share your<br />
            <span className="text-accent inline-block -rotate-1 underline decoration-wavy decoration-accent/50">
              ideas
            </span>
          </h1>
          <p className="font-body text-xl text-pencil/70 max-w-lg mx-auto">
            A place to read, write, and deepen your understanding of the world.
          </p>
          <Link to="/register">
            <Button size="lg" className="inline-flex items-center gap-2">
              <PenLine size={20} strokeWidth={2.5} />
              Start writing
            </Button>
          </Link>
        </section>
      )}

      <div className="space-y-4">
        {activeSearch && (
          <div className="flex items-center gap-2 font-body text-pencil">
            <span className="text-pencil/60">Results for</span>
            <span className="flex items-center gap-2 px-3 py-1 bg-postit border-2 border-pencil wobbly-tag">
              “{activeSearch}”
              <button
                onClick={() => setSearchParams({})}
                className="text-pencil/60 hover:text-accent transition-colors"
                aria-label="Clear search"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </span>
          </div>
        )}

        {/* Tag filters are for browsing; hidden on the focused results page. */}
        {!searching && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={[
                  'flex items-center gap-1 px-3 py-1.5 font-body text-sm border-2 border-pencil transition-all duration-100 wobbly-tag',
                  activeTag === tag ? 'bg-pencil text-paper' : 'bg-white text-pencil hover:bg-muted',
                ].join(' ')}
              >
                <Tag size={12} strokeWidth={2.5} />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* People — only while searching, and only when there are matches. */}
      {showPeople && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-heading text-2xl text-pencil">
            <Users size={20} strokeWidth={2.5} /> People
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {people.slice(0, MAX_PEOPLE).map((u) => (
              <UserCard key={u._id} user={u} />
            ))}
          </div>
        </section>
      )}

      {/* Stories */}
      <section className="space-y-4">
        {searching && (
          <h2 className="flex items-center gap-2 font-heading text-2xl text-pencil">
            <FileText size={20} strokeWidth={2.5} /> Stories
          </h2>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 pt-1">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          searching ? (
            showPeople ? (
              <p className="font-body text-pencil/60">No stories match “{activeSearch}”.</p>
            ) : (
              <div className="text-center py-20 space-y-2">
                <p className="font-heading text-3xl text-pencil">No results found!</p>
                <p className="font-body text-pencil/60">Try a different search.</p>
              </div>
            )
          ) : (
            <div className="text-center py-20 space-y-4">
              <p className="font-heading text-3xl text-pencil">No stories found!</p>
              <p className="font-body text-pencil/60">
                {activeTag ? 'Try a different tag.' : 'Be the first to write something.'}
              </p>
              {isAuthenticated && !activeTag && (
                <Link to="/write"><Button>Write a story</Button></Link>
              )}
            </div>
          )
        ) : (
          <div className="grid gap-6 md:grid-cols-2 pt-1">
            {posts.map((post, i) => (
              <PostCard
                key={post._id}
                post={post}
                index={i}
                isOwn={!!user && post.author?.username === user.username}
              />
            ))}
          </div>
        )}
      </section>

      {!loading && posts.length > 0 && (
        <Pagination
          page={currentPage}
          pages={pagination.pages}
          total={pagination.total}
          perPage={perPage}
          perPageOptions={PER_PAGE_OPTIONS}
          onChange={handlePage}
          onPerPageChange={handlePerPage}
        />
      )}
    </div>
  );
};
