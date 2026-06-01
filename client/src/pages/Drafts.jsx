import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Pencil, Trash2, PenLine, Send } from 'lucide-react';
import { postsApi } from '../api/posts.js';
import { Button } from '../components/ui/Button.jsx';
import { useFeedback } from '../components/feedback/FeedbackProvider.jsx';

const Spinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-pencil border-t-accent rounded-full animate-spin" />
  </div>
);

export const Drafts = () => {
  const navigate = useNavigate();
  const { toast, confirm } = useFeedback();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const { data } = await postsApi.getMyDrafts();
        setDrafts(data.data.posts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, []);

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete draft?',
      message: 'This draft will be permanently removed. This cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await postsApi.deletePost(id);
      setDrafts((prev) => prev.filter((d) => d._id !== id));
      toast.success('Draft deleted');
    } catch {
      toast.error('Could not delete draft', 'Please try again.');
    }
  };

  const handlePublish = async (id) => {
    setPublishingId(id);
    try {
      const { data } = await postsApi.updatePost(id, { status: 'published' });
      toast.success('Story published!');
      navigate(`/post/${data.data.post.slug}`);
    } catch {
      setPublishingId(null);
      toast.error('Could not publish', 'Please try again.');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b-2 border-dashed border-pencil pb-3">
        <h1 className="font-heading text-3xl text-pencil">Your drafts</h1>
        <Link to="/write">
          <Button size="sm" className="flex items-center gap-2">
            <PenLine size={16} strokeWidth={2.5} />
            New story
          </Button>
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="font-heading text-2xl text-pencil">No drafts yet</p>
          <p className="font-body text-pencil/60">Drafts you save will show up here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft, i) => (
            <div
              key={draft._id}
              className="bg-white border-2 border-pencil shadow-hard p-5 flex items-start justify-between gap-4"
              style={{
                borderRadius:
                  i % 2 === 0
                    ? '255px 15px 225px 15px / 15px 225px 15px 255px'
                    : '15px 255px 15px 225px / 225px 15px 255px 15px',
              }}
            >
              <div className="min-w-0 space-y-1">
                <h2 className="font-heading text-xl text-pencil truncate">
                  {draft.title || 'Untitled draft'}
                </h2>
                {draft.excerpt && (
                  <p className="font-body text-sm text-pencil/60 line-clamp-2">{draft.excerpt}</p>
                )}
                <div className="flex items-center gap-3 font-body text-xs text-pencil/50 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={11} strokeWidth={2.5} />
                    Edited {new Date(draft.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-0.5 bg-postit border border-pencil wobbly-tag">
                    {draft.format === 'markdown' ? 'Markdown' : 'Rich text'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => handlePublish(draft._id)}
                  loading={publishingId === draft._id}
                  className="flex items-center gap-1.5"
                >
                  <Send size={14} strokeWidth={2.5} />
                  Publish
                </Button>
                <Link to={`/write/${draft._id}`}>
                  <Button variant="secondary" size="sm" className="flex items-center gap-1.5 w-full">
                    <Pencil size={14} strokeWidth={2.5} />
                    Edit
                  </Button>
                </Link>
                <button
                  onClick={() => handleDelete(draft._id)}
                  className="flex items-center gap-1.5 justify-center px-3 py-1.5 text-sm font-body text-pencil/50 hover:text-accent transition-colors"
                >
                  <Trash2 size={14} strokeWidth={2.5} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
