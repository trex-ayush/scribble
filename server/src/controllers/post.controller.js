import { postService } from '../services/post.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const postController = {
  getFeed: asyncHandler(async (req, res) => {
    const { page, tag, search, limit } = req.query;
    const result = await postService.getFeed({ page: parseInt(page) || 1, tag, search, limit });
    ApiResponse.success(res, result);
  }),

  getPost: asyncHandler(async (req, res) => {
    const post = await postService.getPost(req.params.slug);
    ApiResponse.success(res, { post });
  }),

  getMyDrafts: asyncHandler(async (req, res) => {
    const posts = await postService.getUserDrafts(req.user.id);
    ApiResponse.success(res, { posts });
  }),

  getTags: asyncHandler(async (req, res) => {
    const tags = await postService.getPopularTags(20);
    ApiResponse.success(res, { tags });
  }),

  getOwnPost: asyncHandler(async (req, res) => {
    const post = await postService.getOwnPost(req.params.id, req.user.id);
    ApiResponse.success(res, { post });
  }),

  createPost: asyncHandler(async (req, res) => {
    const post = await postService.createPost(req.user.id, req.body);
    ApiResponse.created(res, { post }, 'Post created');
  }),

  updatePost: asyncHandler(async (req, res) => {
    const post = await postService.updatePost(req.params.id, req.user.id, req.body);
    ApiResponse.success(res, { post }, 'Post updated');
  }),

  deletePost: asyncHandler(async (req, res) => {
    await postService.deletePost(req.params.id, req.user.id);
    ApiResponse.noContent(res);
  }),

  toggleClap: asyncHandler(async (req, res) => {
    const result = await postService.toggleClap(req.params.id, req.user.id);
    ApiResponse.success(res, result);
  }),
};
