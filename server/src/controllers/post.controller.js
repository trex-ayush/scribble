import { postService } from '../services/post.service.js';
import { teamService } from '../services/team.service.js';
import { can } from '../middleware/workspace.middleware.js';
import { Post } from '../models/post.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolveVisitor } from '../utils/visitor.js';

// Resolve the effective author for a post action performed by a team member.
// Returns the post if the requester has the required permission.
const resolvePostAccess = async (postId, requesterId, action) => {
  const post = await Post.findById(postId).select('author status');
  if (!post) throw ApiError.notFound('Post not found');
  const isOwner = post.author.toString() === requesterId.toString();
  if (!isOwner) {
    const allowed = await teamService.checkPermission(requesterId, post.author, action);
    if (!allowed) throw ApiError.forbidden('You do not have permission to perform this action');
  }
  return post;
};

export const postController = {
  getFeed: asyncHandler(async (req, res) => {
    const { page, tag, search, limit } = req.query;
    const result = await postService.getFeed({ page: parseInt(page) || 1, tag, search, limit });
    ApiResponse.success(res, result);
  }),

  getPost: asyncHandler(async (req, res) => {
    const visitorKey = resolveVisitor(req, res);
    const post = await postService.getPost(req.params.slug, { viewerId: req.user?.id, visitorKey });
    ApiResponse.success(res, { post });
  }),

  recordRead: asyncHandler(async (req, res) => {
    const visitorKey = resolveVisitor(req, res);
    await postService.recordRead(req.params.id, { viewerId: req.user?.id, visitorKey });
    ApiResponse.noContent(res);
  }),

  getAnalytics: asyncHandler(async (req, res) => {
    const result = await postService.getAnalytics(req.workspaceOwner || req.user.id);
    ApiResponse.success(res, result);
  }),

  getMyDrafts: asyncHandler(async (req, res) => {
    // Drafts belong to the active workspace owner (personal or a team).
    const posts = await postService.getUserDrafts(req.workspaceOwner || req.user.id);
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
    const role = req.workspaceRole || 'owner';
    if (!can(role, 'create')) {
      throw ApiError.forbidden('You do not have permission to create posts in this workspace');
    }
    // Authored under the active workspace owner; falls back to the requester
    // (public API via Basic Auth, where no workspace context is resolved).
    const authorId = req.workspaceOwner || req.user.id;
    const post = await postService.createPost(authorId, req.body);
    ApiResponse.created(res, { post }, 'Post created');
  }),

  updatePost: asyncHandler(async (req, res) => {
    const existingPost = await resolvePostAccess(req.params.id, req.user.id, 'update');
    // If body changes status to published, also check publish permission.
    if (req.body.status === 'published' && existingPost.status !== 'published') {
      await resolvePostAccess(req.params.id, req.user.id, 'publish');
    }
    const post = await postService.updatePost(req.params.id, existingPost.author, req.body);
    ApiResponse.success(res, { post }, 'Post updated');
  }),

  deletePost: asyncHandler(async (req, res) => {
    const existingPost = await resolvePostAccess(req.params.id, req.user.id, 'delete');
    await postService.deletePost(req.params.id, existingPost.author);
    ApiResponse.noContent(res);
  }),

  toggleClap: asyncHandler(async (req, res) => {
    // Claps as the active account (owner when impersonating with full access).
    const result = await postService.toggleClap(req.params.id, req.workspaceOwner || req.user.id);
    ApiResponse.success(res, result);
  }),
};
