import mongoose from 'mongoose';

/**
 * One record per webhook delivery attempt-set (a single event sent to a single
 * webhook, after any retries). Powers the "Webhook Events" log: occurred-at,
 * event id/type, status, and the full request/response for the detail view.
 */
const webhookDeliverySchema = new mongoose.Schema(
  {
    webhook: { type: mongoose.Schema.Types.ObjectId, ref: 'Webhook', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: String, required: true }, // shared across all hooks for one event
    event: { type: String, required: true },
    source: { type: String, default: 'app' }, // origin of the trigger
    status: { type: String, enum: ['success', 'failed'], required: true },
    statusCode: { type: Number, default: null },
    attempts: { type: Number, default: 1 },
    error: { type: String, default: null },
    requestBody: { type: String, default: null }, // the JSON we POSTed
    responseBody: { type: String, default: null }, // receiver's response (truncated)
  },
  { timestamps: true }
);

// Log listing + filters (by owner, optionally a webhook / event / status), newest first.
webhookDeliverySchema.index({ owner: 1, createdAt: -1 });
webhookDeliverySchema.index({ webhook: 1, createdAt: -1 });
// Auto-expire after 90 days (mirrors activity log / notifications retention).
webhookDeliverySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const WebhookDelivery = mongoose.model('WebhookDelivery', webhookDeliverySchema);
