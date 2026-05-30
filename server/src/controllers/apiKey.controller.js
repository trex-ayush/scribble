import { apiKeyService } from '../services/apiKey.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const apiKeyController = {
  getSettings: asyncHandler(async (req, res) => {
    const settings = await apiKeyService.getSettings(req.user.id);
    ApiResponse.success(res, settings);
  }),

  generate: asyncHandler(async (req, res) => {
    const result = await apiKeyService.generate(req.user.id);
    ApiResponse.created(res, result, 'API credentials generated');
  }),

  setEnabled: asyncHandler(async (req, res) => {
    const settings = await apiKeyService.setEnabled(req.user.id, !!req.body.enabled);
    ApiResponse.success(res, settings, 'API access updated');
  }),

  revoke: asyncHandler(async (req, res) => {
    const settings = await apiKeyService.revoke(req.user.id);
    ApiResponse.success(res, settings, 'API credentials revoked');
  }),
};
