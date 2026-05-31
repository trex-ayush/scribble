import { commentService } from '../services/comment.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const commentController = {
  getComments: asyncHandler(async (req, res) => {
    const comments = await commentService.getComments(req.params.slug);
    ApiResponse.success(res, { comments });
  }),

  addComment: asyncHandler(async (req, res) => {
    // Authored by the active account (owner when a full member is impersonating).
    const comment = await commentService.addComment(
      req.params.slug,
      req.workspaceOwner || req.user.id,
      req.body.content
    );
    ApiResponse.created(res, { comment }, 'Comment added');
  }),

  deleteComment: asyncHandler(async (req, res) => {
    // Active account drives the author/post-owner permission check.
    await commentService.deleteComment(req.params.id, req.workspaceOwner || req.user.id);
    ApiResponse.noContent(res);
  }),
};
