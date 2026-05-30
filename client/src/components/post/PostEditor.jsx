import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlock from '@tiptap/extension-code-block';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Bold, Italic, Heading2, Heading3,
  List, ListOrdered, Code, Quote, Undo, Redo,
} from 'lucide-react';

const ToolbarBtn = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={[
      'p-2 border border-transparent hover:border-pencil hover:bg-muted transition-all duration-100 rounded',
      active ? 'bg-pencil text-paper border-pencil' : 'text-pencil',
    ].join(' ')}
  >
    {children}
  </button>
);

const TOOLBAR_ITEMS = (editor) => [
  { icon: Bold, title: 'Bold', action: () => editor.chain().focus().toggleBold().run(), active: () => editor.isActive('bold') },
  { icon: Italic, title: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), active: () => editor.isActive('italic') },
  null,
  { icon: Heading2, title: 'Heading 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: () => editor.isActive('heading', { level: 2 }) },
  { icon: Heading3, title: 'Heading 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: () => editor.isActive('heading', { level: 3 }) },
  null,
  { icon: List, title: 'Bullet list', action: () => editor.chain().focus().toggleBulletList().run(), active: () => editor.isActive('bulletList') },
  { icon: ListOrdered, title: 'Ordered list', action: () => editor.chain().focus().toggleOrderedList().run(), active: () => editor.isActive('orderedList') },
  { icon: Quote, title: 'Blockquote', action: () => editor.chain().focus().toggleBlockquote().run(), active: () => editor.isActive('blockquote') },
  { icon: Code, title: 'Code block', action: () => editor.chain().focus().toggleCodeBlock().run(), active: () => editor.isActive('codeBlock') },
  null,
  { icon: Undo, title: 'Undo', action: () => editor.chain().focus().undo().run(), active: () => false },
  { icon: Redo, title: 'Redo', action: () => editor.chain().focus().redo().run(), active: () => false },
];

export const PostEditor = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false }),
      Heading.configure({ levels: [2, 3] }),
      CodeBlock,
      Placeholder.configure({ placeholder: 'Tell your story...' }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const items = TOOLBAR_ITEMS(editor);
  const words = editor.storage.characterCount?.words() ?? 0;

  return (
    <div className="border-2 border-pencil shadow-hard wobbly-md overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 px-4 py-3 border-b-2 border-dashed border-pencil bg-muted/30">
        {items.map((item, i) =>
          item === null ? (
            <div key={i} className="w-px h-5 bg-pencil/25 mx-1" />
          ) : (
            <ToolbarBtn key={i} onClick={item.action} active={item.active()} title={item.title}>
              <item.icon size={16} strokeWidth={2.5} />
            </ToolbarBtn>
          )
        )}
        <span className="ml-auto font-body text-xs text-pencil/50">{words} words</span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};
