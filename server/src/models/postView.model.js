import mongoose from 'mongoose';

const postViewSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    visitor: { type: String, required: true }, // "u:<userId>" or "a:<cookieId>"
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One row per (post, visitor) — the basis for unique view/read counts.
postViewSchema.index({ post: 1, visitor: 1 }, { unique: true });

export const PostView = mongoose.model('PostView', postViewSchema);
