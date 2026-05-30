import { userService } from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const userController = {
  searchUsers: asyncHandler(async (req, res) => {
    const users = await userService.searchUsers(req.query.q || req.query.search);
    ApiResponse.success(res, { users });
  }),

  getProfile: asyncHandler(async (req, res) => {
    const user = await userService.getProfile(req.params.username);
    ApiResponse.success(res, { user });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    // Edits the active account's profile. Read-only members are blocked by the
    // enforceReadOnly middleware before reaching here.
    const user = await userService.updateProfile(req.workspaceOwner || req.user.id, req.body);
    ApiResponse.success(res, { user }, 'Profile updated');
  }),

  getUserPosts: asyncHandler(async (req, res) => {
    const posts = await userService.getUserPosts(req.params.username, req.user?.id);
    ApiResponse.success(res, { posts });
  }),

  toggleFollow: asyncHandler(async (req, res) => {
    const result = await userService.toggleFollow(req.user.id, req.params.username);
    ApiResponse.success(res, result);
  }),

  getFollowers: asyncHandler(async (req, res) => {
    const users = await userService.getConnections(req.params.username, 'followers');
    ApiResponse.success(res, { users });
  }),

  getFollowing: asyncHandler(async (req, res) => {
    const users = await userService.getConnections(req.params.username, 'following');
    ApiResponse.success(res, { users });
  }),
};
