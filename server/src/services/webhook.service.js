import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import { Webhook } from '../models/webhook.model.js';
import { WebhookDelivery } from '../models/webhookDelivery.model.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const MAX_WEBHOOKS = 10;
const DELIVERY_TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 1000, 3000]; // before attempt 1, 2, 3
const AUTO_DISABLE_AFTER = 15; // consecutive failures before we stop trying
const MAX_BODY_LOG = 4000; // cap stored request/response bodies

const _sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const _truncate = (s) => (s && s.length > MAX_BODY_LOG ? `${s.slice(0, MAX_BODY_LOG)}…` : s);

// Owner-facing shape — includes the signing secret but never the Basic-Auth password (write-only).
const _view = (w) => ({
  id: w._id,
  name: w.name,
  url: w.url,
  events: w.events,
  secret: w.secret,
  active: w.active,
  retry: w.retry,
  basicAuth: { username: w.basicAuth?.username || null },
  hasBasicAuth: !!w.basicAuth?.username,
  failureCount: w.failureCount,
  lastStatus: w.lastStatus,
  lastError: w.lastError,
  lastDeliveryAt: w.lastDeliveryAt,
  createdAt: w.createdAt,
});

// --- SSRF guard ----------------------------------------------------------
const _isPrivateHost = (host) => {
  let h = host.toLowerCase().replace(/^\[|\]$/g, ''); // strip IPv6 brackets
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '::1' || h === '::' || h === '0.0.0.0') return true;
  const mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped IPv6
  if (mapped) h = mapped[1];
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true; // link-local / cloud metadata
  if (/^(fc|fd)[0-9a-f]{2}:/.test(h)) return true; // IPv6 unique-local fc00::/7
  if (/^fe[89ab][0-9a-f]:/.test(h)) return true; // IPv6 link-local fe80::/10
  return false;
};

// DNS-rebinding guard: a hostname that passed _assertSafeUrl at save time can
// later resolve to an internal IP. Re-check every resolved address at send time.
const _assertPublicResolved = async (hostname) => {
  let addrs;
  try {
    addrs = await dns.lookup(hostname, { all: true });
  } catch {
    throw ApiError.badRequest('Could not resolve webhook host');
  }
  if (addrs.some((a) => _isPrivateHost(a.address))) {
    throw ApiError.badRequest('Webhook URL resolves to a private address');
  }
};

const _assertSafeUrl = (raw) => {
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw ApiError.badRequest('Invalid webhook URL');
  }
  if (!['http:', 'https:'].includes(u.protocol)) {
    throw ApiError.badRequest('Webhook URL must use http or https');
  }
  if (!env.isDev) {
    if (u.protocol !== 'https:') throw ApiError.badRequest('Webhook URL must use https');
    if (_isPrivateHost(u.hostname)) throw ApiError.badRequest('Webhook URL must be a public address');
  }
  return u.href;
};

// object enables, null clears, undefined leaves unchanged. Enabling needs a
// username, and a password unless one is already stored.
const _applyBasicAuth = (hook, basicAuth) => {
  if (basicAuth === undefined) return;
  if (basicAuth === null) {
    hook.basicAuth = { username: null, password: null };
    return;
  }
  if (!basicAuth.username) throw ApiError.badRequest('Basic Auth needs a username');
  const hasNewPassword = basicAuth.password !== undefined && basicAuth.password !== '';
  const hasExistingPassword = !!hook.basicAuth?.password;
  if (!hasNewPassword && !hasExistingPassword) {
    throw ApiError.badRequest('Basic Auth needs a password');
  }
  hook.basicAuth = hook.basicAuth || {};
  hook.basicAuth.username = basicAuth.username;
  if (hasNewPassword) hook.basicAuth.password = basicAuth.password;
};

export const webhookService = {
  async list(ownerId) {
    const hooks = await Webhook.find({ owner: ownerId }).sort({ createdAt: -1 });
    return hooks.map(_view);
  },

  async getOne(ownerId, id) {
    const hook = await Webhook.findOne({ _id: id, owner: ownerId });
    if (!hook) throw ApiError.notFound('Webhook not found');
    return _view(hook);
  },

  async create(ownerId, { name, url, events, basicAuth, retry }) {
    const count = await Webhook.countDocuments({ owner: ownerId });
    if (count >= MAX_WEBHOOKS) {
      throw ApiError.badRequest(`You can have at most ${MAX_WEBHOOKS} webhooks`);
    }
    const hook = new Webhook({
      owner: ownerId,
      name,
      url: _assertSafeUrl(url),
      events,
      secret: Webhook.genSecret(),
      retry: retry !== false,
    });
    _applyBasicAuth(hook, basicAuth);
    await hook.save();
    return _view(hook);
  },

  async update(ownerId, id, { name, url, events, active, retry, basicAuth }) {
    // Load the stored password so _applyBasicAuth can tell whether one already
    // exists (a blank password on edit means "keep the existing one").
    const hook = await Webhook.findOne({ _id: id, owner: ownerId }).select('+basicAuth.password');
    if (!hook) throw ApiError.notFound('Webhook not found');
    if (name !== undefined) hook.name = name;
    if (url !== undefined) hook.url = _assertSafeUrl(url);
    if (events !== undefined) hook.events = events;
    if (active !== undefined) hook.active = active;
    if (retry !== undefined) hook.retry = retry;
    _applyBasicAuth(hook, basicAuth);
    // Editing the target or (re-)enabling resets the failure streak.
    if (url !== undefined || active === true) hook.failureCount = 0;
    await hook.save();
    return _view(hook);
  },

  async rotateSecret(ownerId, id) {
    const hook = await Webhook.findOne({ _id: id, owner: ownerId });
    if (!hook) throw ApiError.notFound('Webhook not found');
    hook.secret = Webhook.genSecret();
    await hook.save();
    return _view(hook);
  },

  async remove(ownerId, id) {
    const deleted = await Webhook.findOneAndDelete({ _id: id, owner: ownerId });
    if (!deleted) throw ApiError.notFound('Webhook not found');
    await WebhookDelivery.deleteMany({ webhook: id });
  },

  // --- Delivery log ------------------------------------------------------
  async listDeliveries(ownerId, { webhook, event, status, page = 1, limit = 20 } = {}) {
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const filter = { owner: ownerId };
    if (webhook) filter.webhook = webhook;
    if (event) filter.event = event;
    if (status) filter.status = status;

    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * perPage;
    const [items, total] = await Promise.all([
      WebhookDelivery.find(filter)
        .select('-requestBody -responseBody')
        .populate('webhook', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      WebhookDelivery.countDocuments(filter),
    ]);
    return { items, total, page: Number(page), perPage, pages: Math.ceil(total / perPage) };
  },

  async getDelivery(ownerId, id) {
    const delivery = await WebhookDelivery.findOne({ _id: id, owner: ownerId })
      .populate('webhook', 'name url')
      .lean();
    if (!delivery) throw ApiError.notFound('Delivery not found');
    return delivery;
  },

  // --- Dispatch ----------------------------------------------------------
  // Fire-and-forget from event sites: never awaited, never throws — runs in the background.
  dispatch(ownerId, event, data) {
    if (!ownerId) return;
    setImmediate(() => {
      webhookService._deliver(ownerId, event, data).catch((err) =>
        console.error('[Webhook] dispatch', event, err.message)
      );
    });
  },

  async _deliver(ownerId, event, data) {
    const hooks = await Webhook.find({ owner: ownerId, active: true, events: event }).select(
      '+basicAuth.password'
    );
    if (!hooks.length) return;
    const eventId = crypto.randomUUID();
    const payload = JSON.stringify({ id: eventId, event, createdAt: new Date().toISOString(), data });
    await Promise.all(hooks.map((h) => webhookService._send(h, event, eventId, payload)));
  },

  // Synchronously deliver a one-off test event and return the result, so the
  // owner gets immediate confirmation that their endpoint works.
  async sendTest(ownerId, id) {
    const hook = await Webhook.findOne({ _id: id, owner: ownerId }).select('+basicAuth.password');
    if (!hook) throw ApiError.notFound('Webhook not found');
    const eventId = crypto.randomUUID();
    const payload = JSON.stringify({
      id: eventId,
      event: 'webhook.test',
      createdAt: new Date().toISOString(),
      data: { message: 'Test event from Scribble — your webhook is configured correctly.' },
    });
    // Respect the retry setting so a test mirrors real behaviour.
    return webhookService._send(hook, 'webhook.test', eventId, payload, { source: 'test' });
  },

  async _send(hook, event, eventId, payload, opts = {}) {
    const signature = crypto.createHmac('sha256', hook.secret).update(payload).digest('hex');
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Scribble-Webhook/1.0',
      'X-Scribble-Event': event,
      'X-Scribble-Delivery': eventId,
      'X-Scribble-Signature': `sha256=${signature}`,
    };
    if (hook.basicAuth?.username) {
      const token = Buffer.from(`${hook.basicAuth.username}:${hook.basicAuth.password || ''}`).toString('base64');
      headers.Authorization = `Basic ${token}`;
    }

    const maxAttempts = opts.noRetry ? 1 : hook.retry ? MAX_ATTEMPTS : 1;
    let lastStatus = null;
    let lastError = null;
    let responseBody = null;
    let attempts = 0;
    let ok = false;

    // SSRF: validate the resolved IP at send time, not just the saved URL.
    if (!env.isDev) {
      try {
        await _assertPublicResolved(new URL(hook.url).hostname);
      } catch (err) {
        lastError = err.message;
        await webhookService._recordDelivery(hook, {
          eventId, event, ok: false, lastStatus: null, lastError, attempts: 0, payload,
          responseBody: null, source: opts.source,
        });
        return { ok: false, statusCode: null, error: lastError, attempts: 0 };
      }
    }

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (BACKOFF_MS[attempt]) await _sleep(BACKOFF_MS[attempt]);
      attempts = attempt + 1;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
      try {
        const res = await fetch(hook.url, {
          method: 'POST', headers, body: payload, signal: controller.signal, redirect: 'manual',
        });
        lastStatus = res.status;
        responseBody = _truncate(await res.text().catch(() => ''));
        if (res.ok) {
          ok = true;
          break;
        }
        // Don't follow redirects — they can point at internal addresses (SSRF).
        if (res.status >= 300 && res.status < 400) {
          lastError = 'Redirects are not allowed';
          break;
        }
        lastError = `HTTP ${res.status}`;
        if (res.status < 500) break; // client error — retrying won't help
      } catch (err) {
        lastError = err.name === 'AbortError' ? 'Request timed out' : err.message;
      } finally {
        clearTimeout(timer);
      }
    }

    await webhookService._recordDelivery(hook, {
      eventId, event, ok, lastStatus, lastError, attempts, payload, responseBody, source: opts.source,
    });
    return { ok, statusCode: lastStatus, error: ok ? null : lastError, attempts };
  },

  async _recordDelivery(hook, { eventId, event, ok, lastStatus, lastError, attempts, payload, responseBody, source = 'app' }) {
    await WebhookDelivery.create({
      webhook: hook._id,
      owner: hook.owner,
      eventId,
      event,
      source,
      status: ok ? 'success' : 'failed',
      statusCode: lastStatus,
      attempts,
      error: ok ? null : lastError,
      requestBody: _truncate(payload),
      responseBody,
    }).catch((err) => console.error('[Webhook] log', err.message));

    // Update health on the webhook; auto-disable a chronically failing endpoint.
    if (ok) {
      await Webhook.updateOne(
        { _id: hook._id },
        { $set: { failureCount: 0, lastStatus, lastError: null, lastDeliveryAt: new Date() } }
      );
      return;
    }
    const updated = await Webhook.findByIdAndUpdate(
      hook._id,
      { $inc: { failureCount: 1 }, $set: { lastStatus, lastError, lastDeliveryAt: new Date() } },
      { new: true }
    );
    if (updated && updated.failureCount >= AUTO_DISABLE_AFTER && updated.active) {
      updated.active = false;
      await updated.save();
    }
  },
};
