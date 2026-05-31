import { Post } from '../models/post.model.js';
import { ApiError } from '../utils/ApiError.js';
import { notificationService } from './notification.service.js';

const POSTS_PER_PAGE = 10;
const ALLOWED_PER_PAGE = [10, 15, 20, 30, 50, 100];
const AUTHOR_FIELDS = 'username name';

const resolveLimit = (limit) => {
  const n = parseInt(limit, 10);
  return ALLOWED_PER_PAGE.includes(n) ? n : POSTS_PER_PAGE;
};

// Only these fields may be set from a client request body. Prevents mass
// assignment of protected fields (author, slug, claps, readingTime, createdAt).
const WRITABLE_FIELDS = ['title', 'content', 'excerpt', 'tags', 'status', 'format'];
const pickWritable = (data = {}) =>
  WRITABLE_FIELDS.reduce((acc, k) => {
    if (data[k] !== undefined) acc[k] = data[k];
    return acc;
  }, {});

// Escape user input before using it inside a RegExp (prevents ReDoS / regex
// injection in search) and guarantee a string (blocks NoSQL operator objects).
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const postService = {
  async getFeed({ page = 1, tag, search, limit }) {
    const perPage = resolveLimit(limit);
    const filter = { status: 'published' };
    // Coerce to string so a crafted object (e.g. ?tag[$ne]=) can't inject a
    // NoSQL operator into the query.
    if (tag) filter.tags = String(tag);
    if (search) {
      // Escape + anchor as a plain RegExp to prevent regex injection / ReDoS.
      const safe = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ title: safe }, { excerpt: safe }];
    }

    const skip = (page - 1) * perPage;
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', AUTHOR_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .select('-content')
        .lean(),
      Post.countDocuments(filter),
    ]);

    return { posts, total, page, perPage, pages: Math.ceil(total / perPage) };
  },

  async getPost(slug) {
    const post = await Post.findOne({ slug, status: 'published' }).populate(
      'author',
      AUTHOR_FIELDS
    );
    if (!post) throw ApiError.notFound('Post not found');
    return post;
  },

  async getOwnPost(postId, userId) {
    const post = await Post.findOne({ _id: postId, author: userId }).populate(
      'author',
      AUTHOR_FIELDS
    );
    if (!post) throw ApiError.notFound('Post not found');
    return post;
  },

  async createPost(userId, data) {
    return Post.create({ ...pickWritable(data), author: userId });
  },

  async updatePost(postId, userId, data) {
    const post = await Post.findOne({ _id: postId, author: userId });
    if (!post) throw ApiError.notFound('Post not found');
    Object.assign(post, pickWritable(data));
    return post.save();
  },

  async deletePost(postId, userId) {
    const post = await Post.findOneAndDelete({ _id: postId, author: userId });
    if (!post) throw ApiError.notFound('Post not found');
  },

  async toggleClap(postId, userId) {
    const post = await Post.findOne({ _id: postId, status: 'published' });
    if (!post) throw ApiError.notFound('Post not found');
    const hasClapped = post.claps.some((id) => id.equals(userId));
    const op = hasClapped ? '$pull' : '$addToSet';
    const updated = await Post.findByIdAndUpdate(
      postId,
      { [op]: { claps: userId } },
      { new: true }
    );

    // Notify the author when their story gets a clap (not on un-clap).
    if (!hasClapped) {
      await notificationService.notify({
        recipient: post.author,
        actor: userId,
        type: 'clap',
        post: post._id,
      });
    }

    return { clapped: !hasClapped, clapCount: updated.claps.length };
  },

  async getUserDrafts(userId) {
    return Post.find({ author: userId, status: 'draft' })
      .sort({ updatedAt: -1 })
      .lean();
  },

  // Distinct tags actually used in published posts, most-used first.
  async getPopularTags(limit = 20) {
    const result = await Post.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: limit },
    ]);
    return result.map((r) => r._id);
  },
};
