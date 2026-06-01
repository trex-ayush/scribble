import { Bookmark } from '../models/bookmark.model.js';
import { Post } from '../models/post.model.js';
import { ApiError } from '../utils/ApiError.js';

const DEFAULT_PER_PAGE = 10;
const ALLOWED_PER_PAGE = [10, 15, 20, 30, 50];

const resolveLimit = (limit) => {
  const n = parseInt(limit, 10);
  return ALLOWED_PER_PAGE.includes(n) ? n : DEFAULT_PER_PAGE;
};

export const bookmarkService = {
  // Add or remove a bookmark for a published post. Returns the new state.
  async toggle(userId, postId) {
    const post = await Post.findOne({ _id: postId, status: 'published' }).select('_id');
    if (!post) throw ApiError.notFound('Post not found');

    const existing = await Bookmark.findOneAndDelete({ user: userId, post: postId });
    if (existing) return { bookmarked: false };

    await Bookmark.create({ user: userId, post: postId });
    return { bookmarked: true };
  },

  // The current user's saved posts, newest first (paginated).
  async list(userId, { page = 1, limit } = {}) {
    const perPage = resolveLimit(limit);
    const skip = (page - 1) * perPage;
    const filter = { user: userId };

    const [rows, total] = await Promise.all([
      Bookmark.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .populate({
          path: 'post',
          select: '-content',
          populate: { path: 'author', select: 'username name' },
        })
        .lean(),
      Bookmark.countDocuments(filter),
    ]);

    // Drop bookmarks whose post was deleted; expose the saved time on the post.
    const posts = rows
      .filter((r) => r.post)
      .map((r) => ({ ...r.post, bookmarkedAt: r.createdAt }));

    return { posts, total, page, perPage, pages: Math.ceil(total / perPage) };
  },

  // All post ids the user has bookmarked — used by the UI to show saved state.
  async listIds(userId) {
    const rows = await Bookmark.find({ user: userId }).select('post').lean();
    return rows.map((r) => r.post.toString());
  },
};
