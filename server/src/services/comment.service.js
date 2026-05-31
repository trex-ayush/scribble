import { Comment } from '../models/comment.model.js';
import { Post } from '../models/post.model.js';
import { ApiError } from '../utils/ApiError.js';
import { notificationService } from './notification.service.js';

export const commentService = {
  async getComments(postSlug) {
    const post = await Post.findOne({ slug: postSlug, status: 'published' });
    if (!post) throw ApiError.notFound('Post not found');
    return Comment.find({ post: post._id })
      .populate('author', 'username name')
      .sort({ createdAt: -1 })
      .lean();
  },

  async addComment(postSlug, userId, content) {
    const post = await Post.findOne({ slug: postSlug, status: 'published' });
    if (!post) throw ApiError.notFound('Post not found');
    const comment = await Comment.create({ content, author: userId, post: post._id });

    // Notify the post's author that someone commented on their story.
    await notificationService.notify({
      recipient: post.author,
      actor: userId,
      type: 'comment',
      post: post._id,
      comment: comment._id,
    });

    return comment.populate('author', 'username name');
  },

  async deleteComment(commentId, userId) {
    const comment = await Comment.findOne({ _id: commentId, author: userId });
    if (!comment) throw ApiError.notFound('Comment not found');
    await comment.deleteOne();
  },
};
