import { bookmarkService } from '../services/bookmark.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const bookmarkController = {
  list: asyncHandler(async (req, res) => {
    const result = await bookmarkService.list(req.user.id, {
      page: parseInt(req.query.page) || 1,
      limit: req.query.limit,
    });
    ApiResponse.success(res, result);
  }),

  listIds: asyncHandler(async (req, res) => {
    const ids = await bookmarkService.listIds(req.user.id);
    ApiResponse.success(res, { ids });
  }),

  toggle: asyncHandler(async (req, res) => {
    const result = await bookmarkService.toggle(req.user.id, req.params.postId);
    ApiResponse.success(res, result, result.bookmarked ? 'Saved to reading list' : 'Removed from reading list');
  }),
};
