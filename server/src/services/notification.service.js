import { Notification } from '../models/notification.model.js';

const DEFAULT_PER_PAGE = 15;
const ALLOWED_PER_PAGE = [10, 15, 20, 30, 50];

const resolveLimit = (limit) => {
  const n = parseInt(limit, 10);
  return ALLOWED_PER_PAGE.includes(n) ? n : DEFAULT_PER_PAGE;
};

// Types that should not pile up duplicates: re-following or re-clapping the
// same post just refreshes the single existing (unread) notification instead
// of spamming the recipient's inbox. Comments are always distinct events.
const DEDUPED_TYPES = new Set(['follow', 'clap']);

export const notificationService = {
  /**
   * Create a notification. Never throws into the caller — a failed
   * notification must not break the underlying action (follow/clap/comment).
   * Self-directed notifications (actor === recipient) are skipped.
   */
  async notify({ recipient, actor, type, post, comment }) {
    try {
      if (!recipient || !actor) return null;
      if (recipient.toString() === actor.toString()) return null;

      if (DEDUPED_TYPES.has(type)) {
        return await Notification.findOneAndUpdate(
          { recipient, actor, type, ...(post && { post }) },
          { $set: { read: false }, $setOnInsert: { recipient, actor, type, post } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      return await Notification.create({ recipient, actor, type, post, comment });
    } catch (err) {
      console.error('[Notification]', err.message);
      return null;
    }
  },

  async list(userId, { page = 1, limit } = {}) {
    const perPage = resolveLimit(limit);
    const skip = (page - 1) * perPage;
    const filter = { recipient: userId };

    const [items, total, unread] = await Promise.all([
      Notification.find(filter)
        .populate('actor', 'username name')
        .populate('post', 'slug title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, read: false }),
    ]);

    return { items, total, unread, page, perPage, pages: Math.ceil(total / perPage) };
  },

  async unreadCount(userId) {
    return Notification.countDocuments({ recipient: userId, read: false });
  },

  // Mark one notification read — scoped to the recipient (no IDOR).
  async markRead(userId, notificationId) {
    await Notification.updateOne(
      { _id: notificationId, recipient: userId },
      { read: true }
    );
    return notificationService.unreadCount(userId);
  },

  async markAllRead(userId) {
    await Notification.updateMany({ recipient: userId, read: false }, { read: true });
    return 0;
  },
};
