import mongoose from 'mongoose';
import crypto from 'node:crypto';

// Outbound webhooks: a user registers a URL and picks which events get POSTed
// to it, so external systems can react without polling the public API.

// Canonical event catalog. `group` drives the grouped checkboxes in the UI.
export const WEBHOOK_EVENTS = [
  { value: 'post.published', group: 'Posts', label: 'Published', description: 'A story you authored was published.' },
  { value: 'post.updated', group: 'Posts', label: 'Updated', description: 'A published story was edited.' },
  { value: 'post.deleted', group: 'Posts', label: 'Deleted', description: 'A story was deleted.' },
  { value: 'comment.created', group: 'Engagement', label: 'New comment', description: 'Someone responded to one of your posts.' },
  { value: 'comment.deleted', group: 'Engagement', label: 'Comment removed', description: 'A response on your post was removed.' },
  { value: 'clap.created', group: 'Engagement', label: 'New clap', description: 'Someone clapped for one of your posts.' },
  { value: 'follow.created', group: 'Social', label: 'New follower', description: 'Someone started following you.' },
  { value: 'follow.deleted', group: 'Social', label: 'Unfollowed', description: 'Someone unfollowed you.' },
  { value: 'team.member_added', group: 'Team', label: 'Member added', description: 'You added someone to your workspace.' },
  { value: 'team.member_removed', group: 'Team', label: 'Member removed', description: 'You removed someone from your workspace.' },
  { value: 'team.role_changed', group: 'Team', label: 'Role changed', description: "A workspace member's role changed." },
];
export const WEBHOOK_EVENT_VALUES = WEBHOOK_EVENTS.map((e) => e.value);

const webhookSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    url: { type: String, required: true, trim: true },
    events: {
      type: [String],
      enum: WEBHOOK_EVENT_VALUES,
      required: true,
      validate: { validator: (v) => v.length > 0, message: 'Pick at least one event' },
    },
    // Signing secret — HMAC'd into every payload so the receiver can verify us.
    secret: { type: String, required: true },
    // Optional Basic Auth header on delivery. Password is write-only (never returned).
    basicAuth: {
      username: { type: String, default: null },
      password: { type: String, default: null, select: false },
    },
    // Retry failed deliveries (5xx/timeout) with backoff. Off = single attempt.
    retry: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    // Delivery health, surfaced in the owner's settings.
    failureCount: { type: Number, default: 0 }, // consecutive failures
    lastStatus: { type: Number, default: null }, // last HTTP status seen
    lastError: { type: String, default: null },
    lastDeliveryAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// List a user's webhooks, newest first.
webhookSchema.index({ owner: 1, createdAt: -1 });
// Dispatch lookup: active hooks for an owner subscribed to a given event.
webhookSchema.index({ owner: 1, active: 1, events: 1 });

webhookSchema.statics.genSecret = () => `whsec_${crypto.randomBytes(24).toString('hex')}`;

export const Webhook = mongoose.model('Webhook', webhookSchema);
