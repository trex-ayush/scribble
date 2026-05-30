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
    const [logs, total] = await Promise.all([
      ActivityLog.find({ actor: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      ActivityLog.countDocuments({ actor: userId }),
    ]);
    return { logs, total, page, perPage, pages: Math.ceil(total / perPage) };
  },
};
