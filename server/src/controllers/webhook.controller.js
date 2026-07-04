import { webhookService } from '../services/webhook.service.js';
import { WEBHOOK_EVENTS } from '../models/webhook.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const webhookController = {
  // Catalog of subscribable events, so the UI can render the choices.
  listEvents: asyncHandler(async (req, res) => {
    ApiResponse.success(res, { events: WEBHOOK_EVENTS });
  }),

  list: asyncHandler(async (req, res) => {
    const webhooks = await webhookService.list(req.user.id);
    ApiResponse.success(res, { webhooks });
  }),

  getOne: asyncHandler(async (req, res) => {
    const webhook = await webhookService.getOne(req.user.id, req.params.id);
    ApiResponse.success(res, { webhook });
  }),

  create: asyncHandler(async (req, res) => {
    const webhook = await webhookService.create(req.user.id, req.body);
    ApiResponse.created(res, webhook, 'Webhook created');
  }),

  update: asyncHandler(async (req, res) => {
    const webhook = await webhookService.update(req.user.id, req.params.id, req.body);
    ApiResponse.success(res, webhook, 'Webhook updated');
  }),

  rotateSecret: asyncHandler(async (req, res) => {
    const webhook = await webhookService.rotateSecret(req.user.id, req.params.id);
    ApiResponse.success(res, webhook, 'Signing secret rotated');
  }),

  remove: asyncHandler(async (req, res) => {
    await webhookService.remove(req.user.id, req.params.id);
    ApiResponse.success(res, null, 'Webhook deleted');
  }),

  test: asyncHandler(async (req, res) => {
    const result = await webhookService.sendTest(req.user.id, req.params.id);
    ApiResponse.success(res, result, result.ok ? 'Test event delivered' : 'Test event failed');
  }),

  // --- Delivery log ("Webhook Events") ---
  listDeliveries: asyncHandler(async (req, res) => {
    const result = await webhookService.listDeliveries(req.user.id, req.query);
    ApiResponse.success(res, result);
  }),

  getDelivery: asyncHandler(async (req, res) => {
    const delivery = await webhookService.getDelivery(req.user.id, req.params.id);
    ApiResponse.success(res, { delivery });
  }),
};
