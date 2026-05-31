import { User } from '../models/user.model.js';
import { Post } from '../models/post.model.js';
import { ApiError } from '../utils/ApiError.js';
import { notificationService } from './notification.service.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const userService = {
  async searchUsers(query, limit = 15) {
    const q = (query || '').trim();
    if (!q) return [];
    const regex = new RegExp(escapeRegex(q), 'i');
    return User.find({ $or: [{ username: regex }, { name: regex }] })
      .select('username name bio followers')
      .limit(limit)
      .lean();
  },

  async getProfile(identifier) {
    const query = /^[0-9a-fA-F]{24}$/.test(identifier)
      ? { _id: identifier }
      : { username: identifier };
    const user = await User.findOne(query);
    if (!user) throw ApiError.notFound('User not found');
    // Public endpoint (no auth) — never leak email / apiKey / credentials.
    return user.toProfileJSON();
  },

  // field: 'followers' | 'following' — returns the populated user list.
  async getConnections(username, field) {
    const user = await User.findOne({ username }).populate(field, 'username name bio');
    if (!user) throw ApiError.notFound('User not found');
    return user[field];
  },

  async updateProfile(userId, { name, bio }) {
    const user = await User.findByIdAndUpdate(
      userId,
      { name, bio },
      { new: true, runValidators: true }
    );
    if (!user) throw ApiError.notFound('User not found');
    return user.toPublicJSON();
  },

  async getUserPosts(username, requesterId) {
    const user = await User.findOne({ username });
    if (!user) throw ApiError.notFound('User not found');
    const isOwner = requesterId?.toString() === user._id.toString();
    const filter = { author: user._id, ...(!isOwner && { status: 'published' }) };
    return Post.find(filter)
      .populate('author', 'username name')
      .sort({ createdAt: -1 })
      .lean();
  },

  async toggleFollow(followerId, targetUsername) {
    if (!followerId) throw ApiError.unauthorized();
    const [follower, target] = await Promise.all([
      User.findById(followerId),
      User.findOne({ username: targetUsername }),
    ]);
    if (!target) throw ApiError.notFound('User not found');
    if (follower._id.equals(target._id)) throw ApiError.badRequest('Cannot follow yourself');

    const isFollowing = follower.following.some((id) => id.equals(target._id));
    const op = isFollowing ? '$pull' : '$addToSet';

    await Promise.all([
      User.findByIdAndUpdate(followerId, { [op]: { following: target._id } }),
      User.findByIdAndUpdate(target._id, { [op]: { followers: followerId } }),
    ]);

    // Notify the target only when starting to follow (not on unfollow).
    if (!isFollowing) {
      await notificationService.notify({
        recipient: target._id,
        actor: followerId,
        type: 'follow',
      });
    }

    return { following: !isFollowing };
  },
};
