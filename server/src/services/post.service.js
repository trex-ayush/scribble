import mongoose from 'mongoose';
import { Post } from '../models/post.model.js';
import { PostView } from '../models/postView.model.js';
import { ApiError } from '../utils/ApiError.js';
import { notificationService } from './notification.service.js';
import { webhookService } from './webhook.service.js';

// Minimal post shape sent in webhook payloads.
const postHookData = (post) => ({
  post: { id: post._id, slug: post.slug, title: post.title, tags: post.tags },
});

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

// Fields never exposed to non-authors / public listings.
const PRIVATE_POST_FIELDS = '-views -uniqueViews -reads -__v';

// Record a page view: total views always, unique only on a newly-created row.
// Counters are eventually-consistent (two non-transactional writes).
const countView = async (postId, visitorKey) => {
  try {
    const r = await PostView.updateOne(
      { post: postId, visitor: visitorKey },
      { $setOnInsert: { read: false } },
      { upsert: true }
    );
    const inc = { views: 1 };
    if (r.upsertedCount === 1) inc.uniqueViews = 1;
    await Post.updateOne({ _id: postId }, { $inc: inc });
  } catch (e) {
    // Lost a concurrent upsert race: the row already exists, count the view only.
    if (e.code === 11000) await Post.updateOne({ _id: postId }, { $inc: { views: 1 } });
    else throw e;
  }
};

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
        .select(`-content ${PRIVATE_POST_FIELDS}`)
        .lean(),
      Post.countDocuments(filter),
    ]);

    return { posts, total, page, perPage, pages: Math.ceil(total / perPage) };
  },

  async getPost(slug, { viewerId, visitorKey } = {}) {
    const post = await Post.findOne({ slug, status: 'published' }).populate(
      'author',
      AUTHOR_FIELDS
    );
    if (!post) throw ApiError.notFound('Post not found');

    const isAuthor = viewerId && post.author._id.equals(viewerId);
    const obj = post.toObject();
    delete obj.__v;

    // Author sees their own denormalized counts inline; readers never do.
    if (isAuthor) {
      obj.views = post.views || 0;
      obj.uniqueViews = post.uniqueViews || 0;
      obj.reads = post.reads || 0;
      return obj;
    }

    if (visitorKey) {
      countView(post._id, visitorKey).catch((e) => console.error('[analytics:view]', e.message));
    }
    delete obj.views;
    delete obj.uniqueViews;
    delete obj.reads;
    return obj;
  },

  async recordRead(postId, { viewerId, visitorKey } = {}) {
    if (!mongoose.isValidObjectId(postId)) throw ApiError.notFound('Post not found');
    const post = await Post.findOne({ _id: postId, status: 'published' }).select('author');
    if (!post) throw ApiError.notFound('Post not found');

    const isAuthor = viewerId && post.author.equals(viewerId);
    if (isAuthor || !visitorKey) return;

    // Flip this visitor's row to read. The before-state tells us whether it's a
    // first read (or a brand-new visitor) so the counter can't be re-inflated.
    let before;
    try {
      before = await PostView.findOneAndUpdate(
        { post: postId, visitor: visitorKey },
        { $set: { read: true } },
        { upsert: true, new: false }
      ).lean();
    } catch (e) {
      if (e.code !== 11000) throw e;
      // Lost the insert race; the row now exists, so flip it without upserting.
      before = await PostView.findOneAndUpdate(
        { post: postId, visitor: visitorKey },
        { $set: { read: true } },
        { new: false }
      ).lean();
    }

    const inc = {};
    if (!before) {
      inc.uniqueViews = 1;
      inc.reads = 1;
    } else if (!before.read) {
      inc.reads = 1;
    }
    if (Object.keys(inc).length) await Post.updateOne({ _id: postId }, { $inc: inc });
  },

  async getAnalytics(authorId) {
    const posts = await Post.find({ author: authorId, status: 'published' })
      .select('title slug readingTime createdAt views uniqueViews reads claps')
      .sort({ uniqueViews: -1, createdAt: -1 })
      .lean();

    const rows = posts.map((p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      readingTime: p.readingTime,
      createdAt: p.createdAt,
      views: p.views || 0,
      uniqueViews: p.uniqueViews || 0,
      reads: p.reads || 0,
      claps: p.claps?.length || 0,
    }));

    const totals = rows.reduce(
      (acc, p) => {
        acc.totalViews += p.views;
        acc.totalUniqueViews += p.uniqueViews;
        acc.totalReads += p.reads;
        acc.totalClaps += p.claps;
        return acc;
      },
      { totalPosts: rows.length, totalViews: 0, totalUniqueViews: 0, totalReads: 0, totalClaps: 0 }
    );

    return { totals, posts: rows };
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
    const post = await Post.create({ ...pickWritable(data), author: userId });
    if (post.status === 'published') {
      webhookService.dispatch(post.author, 'post.published', postHookData(post));
    }
    return post;
  },

  async updatePost(postId, userId, data) {
    const post = await Post.findOne({ _id: postId, author: userId });
    if (!post) throw ApiError.notFound('Post not found');
    const wasPublished = post.status === 'published';
    Object.assign(post, pickWritable(data));
    const saved = await post.save();
    // First publish fires post.published; editing an already-live post fires post.updated.
    if (saved.status === 'published') {
      const event = wasPublished ? 'post.updated' : 'post.published';
      webhookService.dispatch(saved.author, event, postHookData(saved));
    }
    return saved;
  },

  async deletePost(postId, userId) {
    const post = await Post.findOneAndDelete({ _id: postId, author: userId });
    if (!post) throw ApiError.notFound('Post not found');
    webhookService.dispatch(post.author, 'post.deleted', postHookData(post));
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

      // Notify the author's external integrations.
      webhookService.dispatch(post.author, 'clap.created', {
        ...postHookData(post),
        clapBy: userId,
        clapCount: updated.claps.length,
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
