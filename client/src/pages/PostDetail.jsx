import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, Tag, Heart, Trash2, Send, Pencil } from 'lucide-react';
import { postsApi } from '../api/posts.js';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.jsx';
import { Textarea } from '../components/ui/Input.jsx';
import { PostContent } from '../components/post/PostContent.jsx';
import { BookmarkButton } from '../components/post/BookmarkButton.jsx';
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
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [clapState, setClapState] = useState({ clapped: false, count: 0 });

  useEffect(() => {
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

  const handleClap = async () => {
    if (!isAuthenticated) return navigate('/login');
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
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-heading text-4xl md:text-5xl text-pencil leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <BookmarkButton postId={post._id} variant="full" />
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

      <PostContent content={post.content} format={post.format} />

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
            <Link to="/login" className="text-ink hover:underline">Sign in</Link> to leave a response.
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
    </article>
  );
};
