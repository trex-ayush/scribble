import { searchService } from '../services/search.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const searchController = {
  suggest: asyncHandler(async (req, res) => {
    const result = await searchService.suggest(req.query.q || req.query.search);
    ApiResponse.success(res, result);
  }),
};
