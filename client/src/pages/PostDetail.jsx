import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Clock, Tag, Heart, Trash2, Send, Pencil, Eye, BookOpen, ArrowUp, Share2 } from 'lucide-react';
import { postsApi } from '../api/posts.js';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.jsx';
import { Textarea } from '../components/ui/Input.jsx';
import { PostContent } from '../components/post/PostContent.jsx';
import { BookmarkButton } from '../components/post/BookmarkButton.jsx';
import { Tooltip } from '../components/ui/Tooltip.jsx';
import { withNext } from '../lib/authRedirect.js';
import { useFeedback } from '../components/feedback/FeedbackProvider.jsx';
import { workspaceStore } from '../store/workspaceStore.js';

const Spinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-pencil border-t-accent rounded-full animate-spin" />
  </div>
);

export const PostDetail = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast, confirm } = useFeedback();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [clapState, setClapState] = useState({ clapped: false, count: 0 });
  const [showTop, setShowTop] = useState(false);
  const endRef = useRef(null);
  const readFiredRef = useRef(false);

  useEffect(() => {
    readFiredRef.current = false;
    const fetchData = async () => {
      try {
        const [postRes, commentsRes] = await Promise.all([
          postsApi.getPost(slug),
          postsApi.getComments(slug),
        ]);
        const p = postRes.data.data.post;
        setPost(p);
        setComments(commentsRes.data.data.comments);
        setClapState({
          clapped: user ? p.claps?.some((id) => id === user.id) : false,
          count: p.claps?.length || 0,
        });
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  // Count a read when a non-author scrolls to the end of the article.
  useEffect(() => {
    if (!post || !endRef.current) return;
    if (user?.username === post.author?.username) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !readFiredRef.current) {
          readFiredRef.current = true;
          postsApi.recordRead(post._id).catch(() => {});
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(endRef.current);
    return () => obs.disconnect();
  }, [post, user]);

  // Reveal a "back to top" button once the reader has scrolled down.
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    // Always copy the link...
    try {
      await navigator.clipboard?.writeText(url);
      toast.success('Link copied', 'Share it anywhere.');
    } catch {
      toast.error('Could not copy link');
    }
    // ...and offer the native share sheet where available (mobile).
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
      } catch {
        /* user cancelled */
      }
    }
  };

  const handleClap = async () => {
    if (!isAuthenticated) {
      return navigate(withNext('/login', location.pathname + location.search));
    }
    try {
      const { data } = await postsApi.toggleClap(post._id);
      setClapState({ clapped: data.data.clapped, count: data.data.clapCount });
    } catch { /* ignore */ }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await postsApi.addComment(slug, commentText);
      setComments((prev) => [data.data.comment, ...prev]);
      setCommentText('');
      toast.success('Response posted');
    } catch {
      toast.error('Could not post response', 'Please try again.');
    }
  };

  const handleDeleteComment = async (id) => {
    const ok = await confirm({
      title: 'Delete response?',
      message: 'This comment will be permanently removed.',
      confirmText: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await postsApi.deleteComment(id);
      setComments((prev) => prev.filter((c) => c._id !== id));
      toast.success('Response deleted');
    } catch {
      toast.error('Could not delete response');
    }
  };

  const handleDeletePost = async () => {
    const ok = await confirm({
      title: 'Delete story?',
      message: 'This story will be permanently removed. This cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await postsApi.deletePost(post._id);
      toast.success('Story deleted');
      navigate('/');
    } catch {
      toast.error('Could not delete story', 'Please try again.');
    }
  };

  if (loading) return <Spinner />;
  if (!post) return null;

  // Author = you, OR you're acting in a workspace whose owner authored this
  // post and your role is "full" (read-only members can't edit/delete).
  const activeWs = workspaceStore.getState().active;
  const ownsPost = user?.username === post.author?.username;
  const inOwnerWs = activeWs && activeWs.username === post.author?.username;
  const canEdit = ownsPost || (inOwnerWs && activeWs.role === 'full');
  const canDelete = canEdit;
  const isAuthor = canEdit;

  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-pencil leading-tight break-words">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <BookmarkButton postId={post._id} variant="full" />
            <Button
              size="sm"
              variant="secondary"
              onClick={handleShare}
              className="flex items-center gap-1.5"
            >
              <Share2 size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">Share</span>
            </Button>
            {isAuthor && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/write/${post._id}`)}
                  className="flex items-center gap-1.5"
                >
                  <Pencil size={14} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDeletePost}
                  className="flex items-center gap-1.5"
                >
                  <Trash2 size={14} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 font-body text-pencil/60 text-sm border-b-2 border-dashed border-pencil pb-4">
          <Link
            to={`/@${post.author?.username}`}
            className="hover:text-accent transition-colors font-medium text-pencil"
          >
            {post.author?.name || post.author?.username}
          </Link>
          <span className="flex items-center gap-1">
            <Clock size={12} strokeWidth={2.5} />
            {post.readingTime} min read
          </span>
          <span>
            {new Date(post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </span>
          {post.uniqueViews !== undefined && (
            <>
              <Tooltip label="Unique viewers · total views">
                <span className="flex items-center gap-1">
                  <Eye size={12} strokeWidth={2.5} />
                  {post.uniqueViews} · {post.views ?? 0}
                </span>
              </Tooltip>
              <Tooltip label="Readers who finished the article">
                <span className="flex items-center gap-1">
                  <BookOpen size={12} strokeWidth={2.5} />
                  {post.reads ?? 0}
                </span>
              </Tooltip>
            </>
          )}
        </div>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                to={`/?tag=${tag}`}
                className="flex items-center gap-1 px-2 py-1 bg-muted border border-pencil text-xs font-body hover:bg-pencil hover:text-paper transition-colors wobbly-tag"
              >
                <Tag size={10} strokeWidth={2.5} />
                {tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      <PostContent
        content={post.content}
        format={post.format}
        headingLinks
        onCopyHeading={() => toast.success('Section link copied')}
      />
      <div ref={endRef} aria-hidden="true" />

      <div className="flex items-center gap-4 border-y-2 border-dashed border-pencil py-6">
        <button
          onClick={handleClap}
          className={[
            'flex items-center gap-2 px-4 py-2 border-2 font-body text-sm transition-all duration-100 wobbly-btn',
            clapState.clapped
              ? 'bg-accent text-paper border-accent shadow-hard-red'
              : 'bg-white text-pencil border-pencil shadow-hard hover:bg-accent hover:text-paper hover:border-accent',
          ].join(' ')}
        >
          <Heart size={16} strokeWidth={2.5} fill={clapState.clapped ? 'currentColor' : 'none'} />
          {clapState.count} {clapState.count === 1 ? 'clap' : 'claps'}
        </button>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-2xl text-pencil">
          Responses ({comments.length})
        </h2>

        {isAuthenticated ? (
          <form onSubmit={handleComment} className="space-y-3">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
            />
            <Button type="submit" size="sm" className="flex items-center gap-2">
              <Send size={14} strokeWidth={2.5} />
              Respond
            </Button>
          </form>
        ) : (
          <p className="font-body text-pencil/60">
            <Link to={withNext('/login', location.pathname + location.search)} className="text-ink hover:underline">Sign in</Link> to leave a response.
          </p>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="bg-white border-2 border-pencil p-4 space-y-2 shadow-hard-sm wobbly-md"
            >
              <div className="flex items-center justify-between">
                <Link
                  to={`/@${comment.author?.username}`}
                  className="font-heading text-sm text-pencil hover:text-accent transition-colors"
                >
                  {comment.author?.name || comment.author?.username}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-pencil/50">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  {user?.username === comment.author?.username && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="text-pencil/40 hover:text-accent transition-colors"
                      aria-label="Delete comment"
                    >
                      <Trash2 size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
              <p className="font-body text-sm text-pencil/80 leading-relaxed">{comment.content}</p>
            </div>
          ))}
        </div>
      </section>

      <div
        className={[
          'fixed bottom-20 md:bottom-6 right-6 z-40 transition-all duration-300 ease-out',
          showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="btn btn-primary flex items-center justify-center w-12 h-12"
        >
          <ArrowUp size={20} strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
};
