import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorEmail: { type: String },
    actorName: { type: String },
    // Human-readable event source, e.g. "Post", "Comment", "User Login".
    source: { type: String, required: true },
    // Where the action originated: 'USER' (web app) or 'API' (public API).
    origin: { type: String, enum: ['USER', 'API'], default: 'USER' },
    // Created | Updated | Deleted
    action: { type: String, required: true },
    method: { type: String },
    path: { type: String },
    // Affected resource identifier (id / slug / username).
    eventData: { type: String },
    // Full snapshot of the affected resource for the detail view.
    payload: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

activityLogSchema.index({ actor: 1, createdAt: -1 });
// Auto-expire logs after 90 days (matches the "last 90 days" semantics).
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
