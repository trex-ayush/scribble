import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Send, Type, Hash } from 'lucide-react';
import { postsApi } from '../api/posts.js';
import { PostEditor } from '../components/post/PostEditor.jsx';
import { MarkdownEditor } from '../components/post/MarkdownEditor.jsx';
import { TagInput } from '../components/post/TagInput.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useFeedback } from '../components/feedback/FeedbackProvider.jsx';

const FORMATS = [
  { key: 'html', label: 'Rich Text', icon: Type },
  { key: 'markdown', label: 'Markdown', icon: Hash },
];

const isEmptyContent = (content, format) =>
  format === 'markdown' ? !content.trim() : !content || content === '<p></p>';

export const WritePost = () => {
  const navigate = useNavigate();
  const { toast, confirm } = useFeedback();
  const { id } = useParams(); // present when editing an existing post/draft
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState('html');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  // Load an existing post/draft when editing.
  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      try {
        const { data } = await postsApi.getEditable(id);
        const post = data.data.post;
        setTitle(post.title || '');
        setContent(post.content || '');
        setFormat(post.format || 'html');
        setTags(post.tags || []);
      } catch {
        setError('Could not load this post for editing.');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [id, isEditing]);

  // HTML and Markdown aren't interchangeable, so switching format resets the
  // body to avoid showing raw markup in the wrong editor.
  const switchFormat = async (next) => {
    if (next === format) return;
    if (!isEmptyContent(content, format)) {
      const ok = await confirm({
        title: 'Switch editor?',
        message: 'Switching the editor format will clear your current content.',
        confirmText: 'Switch',
        tone: 'danger',
      });
      if (!ok) return;
    }
    setContent('');
    setFormat(next);
  };

  const save = async (status) => {
    // Title is optional — the server auto-generates one from the content.
    if (isEmptyContent(content, format)) {
      setError('Content is required');
      toast.warning('Content is required', 'Write something before saving.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const tagList = tags.map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 5);
      const payload = { title, content, format, tags: tagList, status };

      const { data } = isEditing
        ? await postsApi.updatePost(id, payload)
        : await postsApi.createPost(payload);

      if (status === 'published') {
        toast.success('Story published!');
        navigate(`/post/${data.data.post.slug}`);
      } else {
        toast.success('Draft saved');
        navigate('/drafts');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save post');
      toast.error('Could not save', err.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-pencil border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-heading text-3xl text-pencil">
          {isEditing ? 'Edit Story' : 'New Story'}
        </h1>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => save('draft')}
            loading={loading}
            className="flex items-center gap-2"
          >
            <Save size={16} strokeWidth={2.5} />
            Save draft
          </Button>
          <Button
            size="sm"
            onClick={() => save('published')}
            loading={loading}
            className="flex items-center gap-2"
          >
            <Send size={16} strokeWidth={2.5} />
            Publish
          </Button>
        </div>
      </div>

      {error && (
        <p className="font-body text-sm text-accent bg-accent/10 border-2 border-accent px-4 py-3 wobbly-tag">
          {error}
        </p>
      )}

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Your story title... (optional — auto-generated if blank)"
        className="font-heading text-2xl border-[3px]"
      />

      <TagInput tags={tags} onChange={setTags} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-body text-sm text-pencil/60">Editor:</span>
        {FORMATS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => switchFormat(key)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-body border-2 border-pencil transition-all duration-100 wobbly-tag',
              format === key ? 'bg-pencil text-paper' : 'bg-white text-pencil hover:bg-muted',
            ].join(' ')}
          >
            <Icon size={14} strokeWidth={2.5} />
            {label}
          </button>
        ))}
      </div>

      {format === 'markdown' ? (
        <MarkdownEditor key="md" content={content} onChange={setContent} />
      ) : (
        <PostEditor key={`html-${id || 'new'}`} content={content} onChange={setContent} />
      )}
    </div>
  );
};
