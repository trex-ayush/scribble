import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // sha256 of the current refresh token — for rotation + reuse detection.
    tokenHash: { type: String, required: true },
    userAgent: { type: String, default: '' },
    device: { type: String, default: 'Unknown device' },
    ip: { type: String, default: '' },
    lastActiveAt: { type: Date, default: Date.now },
    // Refresh-token expiry; the TTL index removes the row when it lapses.
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true } // createdAt = signed-in time
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model('Session', sessionSchema);
