import { ActivityLog } from '../models/activityLog.model.js';

const DEFAULT_PER_PAGE = 15;
const ALLOWED_PER_PAGE = [15, 20, 30, 50, 100];

const resolveLimit = (limit) => {
  const n = parseInt(limit, 10);
  return ALLOWED_PER_PAGE.includes(n) ? n : DEFAULT_PER_PAGE;
};

export const activityService = {
  async getLogs(userId, { page = 1, limit } = {}) {
    const perPage = resolveLimit(limit);
    const skip = (page - 1) * perPage;
    // Show everything that happened in this account — including actions
    // performed by team members. Falls back to actor for legacy logs that
    // predate the `account` field.
    const filter = { $or: [{ account: userId }, { account: { $exists: false }, actor: userId }] };
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);
    return { logs, total, page, perPage, pages: Math.ceil(total / perPage) };
  },
};
