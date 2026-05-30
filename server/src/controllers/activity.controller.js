import { activityService } from '../services/activity.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const activityController = {
  getLogs: asyncHandler(async (req, res) => {
    const result = await activityService.getLogs(req.user.id, {
      page: parseInt(req.query.page) || 1,
      limit: req.query.limit,
    });
    ApiResponse.success(res, result);
  }),
};
