import mongoose from 'mongoose';

/**
 * In-app notification delivered to `recipient` when another user (`actor`)
 * interacts with them: follows them, claps/comments on their post, or adds
 * them to a workspace. The recipient is never equal to the actor (self-actions
 * are skipped at creation time in notification.service).
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['follow', 'clap', 'comment', 'team_add'],
      required: true,
    },
    // Related resources, populated for the ones the notification type uses.
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Inbox listing + unread badge lookups.
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
// Auto-expire after 90 days (mirrors the activity log retention).
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification = mongoose.model('Notification', notificationSchema);
