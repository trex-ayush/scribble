import mongoose from 'mongoose';
import slugify from 'slugify';

// Strip HTML tags and common Markdown syntax so derived fields
// (title, excerpt, reading time) stay accurate regardless of format.
const toPlainText = (raw = '') =>
  raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Build a fallback title from the post body's first words.
const deriveTitle = (content) => {
  const words = toPlainText(content).split(/\s+/).filter(Boolean).slice(0, 8).join(' ');
  if (!words) return 'Untitled Story';
  return words.length > 60 ? `${words.slice(0, 60).trim()}…` : words;
};

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: { type: String, unique: true, lowercase: true },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: { type: String, maxlength: [300, 'Excerpt too long'] },
    format: {
      type: String,
      enum: ['html', 'markdown'],
      default: 'html',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [30, 'Tag too long'],
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    claps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    readingTime: { type: Number, default: 0 },
    // Denormalized analytics counters, kept in sync on view/read events.
    views: { type: Number, default: 0 }, // total page loads
    uniqueViews: { type: Number, default: 0 }, // distinct visitors
    reads: { type: Number, default: 0 }, // distinct visitors who finished reading
  },
  { timestamps: true }
);

// Auto-generate a title from the content when none is provided.
// Runs before validation so the (optional) title is always populated.
postSchema.pre('validate', function (next) {
  if (!this.title || !this.title.trim()) {
    this.title = deriveTitle(this.content);
  }
  next();
});

postSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    // Append an ObjectId hex suffix for slug uniqueness (deterministic).
    const suffix = this._id.toString().slice(-8);
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${suffix}`;
  }
  if (this.isModified('content')) {
    const words = toPlainText(this.content).split(/\s+/).filter(Boolean).length;
    this.readingTime = Math.max(1, Math.ceil(words / 200));
  }
  if (!this.excerpt && this.content) {
    this.excerpt = `${toPlainText(this.content).slice(0, 280)}...`;
  }
  next();
});

postSchema.virtual('clapCount').get(function () {
  return this.claps.length;
});

postSchema.index({ author: 1, status: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });

export const Post = mongoose.model('Post', postSchema);
