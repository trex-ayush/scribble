import { notificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const result = await notificationService.list(req.user.id, {
      page: parseInt(req.query.page) || 1,
      limit: req.query.limit,
    });
    ApiResponse.success(res, result);
  }),

  unreadCount: asyncHandler(async (req, res) => {
    const unread = await notificationService.unreadCount(req.user.id);
    ApiResponse.success(res, { unread });
  }),

  markRead: asyncHandler(async (req, res) => {
    const unread = await notificationService.markRead(req.user.id, req.params.id);
    ApiResponse.success(res, { unread }, 'Notification marked read');
  }),

  markAllRead: asyncHandler(async (req, res) => {
    const unread = await notificationService.markAllRead(req.user.id);
    ApiResponse.success(res, { unread }, 'All notifications marked read');
  }),
};
