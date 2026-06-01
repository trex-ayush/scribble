import mongoose from 'mongoose';

/**
 * A user's saved post ("reading list"). One row per (user, post) pair.
 * Kept as a dedicated collection (rather than an array on the user) so the
 * reading-list page can paginate and "is-bookmarked" checks stay cheap.
 */
const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  },
  { timestamps: true }
);

// One bookmark per user-post pair; also powers fast existence checks.
bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
// Reading-list listing, newest first.
bookmarkSchema.index({ user: 1, createdAt: -1 });

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
