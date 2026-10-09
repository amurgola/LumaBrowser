const IpClass = require('../../../../shared/net/IpClass');
const WebhookPresets = require('../WebhookPresets');
const WebhookEvent = require('./WebhookEvent');
const WebhookFireReply = require('./WebhookFireReply');

class WebhookDelivery {
  constructor({ triggerStore, runner, secrets, emitEvent, rate, fails, ratePerMin, resultWaitMs }) {
    this._store = triggerStore;
    this._runner = runner;
    this._secrets = secrets;
    this._emit = emitEvent;
    this._rate = rate;
    this._fails = fails;
    this._ratePerMin = ratePerMin;
    this._resultWaitMs = resultWaitMs;
  }

  async handle(req, res) {
    const ctx = this._contextFor(req);
    if (this._rateLimited(ctx, req, res)) return;
    if (this._rejectedSignature(ctx, req, res)) return;
    const event = this._eventFor(ctx, req);
    if (this._answeredHandshake(ctx, event, res)) return;
    if (this._capturedSample(ctx, event, res)) return;
    if (this._refusedUnarmed(ctx, event, res)) return;
    if (this._refusedMissingSecret(ctx, event, res)) return;
    await this._fire(ctx, event, req, res);
  }

  _contextFor(req) {
    const trigger = req.trigger;
    const source = trigger.source || {};
    const preset = WebhookPresets.normalizePreset(source.preset);
    return {
      trigger,
      source,
      preset,
      ip: IpClass.clientIp(req) || 'unknown',
      secret: this._secrets ? this._secrets.get(trigger.id) : null,
      needsSecret: WebhookPresets.requiresSecret(preset, source),
    };
  }

  _rateLimited(ctx, req, res) {
    if (this._rate.hit(ctx.trigger.id) <= this._ratePerMin) return false;
    this._log(ctx, 'rate_limited', `over ${this._ratePerMin}/min`, { method: req.method });
    res.status(429).json({ error: 'rate limited' });
    return true;
  }

  _rejectedSignature(ctx, req, res) {
    if (!ctx.secret) return false;
    const verdict = WebhookPresets.verify(ctx.preset, { rawBody: req.body, headers: req.headers, secret: ctx.secret, source: ctx.source });
    if (verdict.ok) return false;
    this._fails.hit(ctx.ip);
    this._emit('rejected', { triggerId: ctx.trigger.id, title: ctx.trigger.title || null, error: verdict.error });
    this._log(ctx, 'rejected', verdict.error, { method: req.method, contentType: req.headers['content-type'] || null });
    res.status(401).json({ error: verdict.error });
    return true;
  }

  _eventFor(ctx, req) {
    const event = WebhookEvent.build(req);
    if (ctx.secret) event.verified = ctx.preset;
    return event;
  }

  _answeredHandshake(ctx, event, res) {
    const body = event.body;
    if (!body || typeof body !== 'object' || body.type !== 'url_verification' || typeof body.challenge !== 'string') return false;
    this._emit('handshake', { triggerId: ctx.trigger.id, title: ctx.trigger.title || null, kind: 'slack-url-verification' });
    this._log(ctx, 'handshake', 'Slack url_verification answered', event);
    res.status(200).json({ challenge: body.challenge });
    return true;
  }

  _capturedSample(ctx, event, res) {
    if (ctx.trigger.sample) return false;
    this._store.setSample(ctx.trigger.id, event);
    this._log(ctx, 'captured', 'stored as the sample', event);
    this._emit('sample-captured', { triggerId: ctx.trigger.id, title: ctx.trigger.title || null });
    this._emit('triggers-changed', { triggerId: ctx.trigger.id });
    res.status(202).json({ captured: true });
    return true;
  }

  _refusedUnarmed(ctx, event, res) {
    if (ctx.trigger.enabled) return false;
    this._log(ctx, 'unarmed', 'trigger not armed', event);
    res.status(503).json({ error: 'trigger not armed' });
    return true;
  }

  _refusedMissingSecret(ctx, event, res) {
    if (!ctx.needsSecret || ctx.secret) return false;
    this._emit('rejected', { triggerId: ctx.trigger.id, title: ctx.trigger.title || null, error: 'signing secret not configured' });
    this._log(ctx, 'no_secret', 'signing secret not configured', event);
    res.status(503).json({ error: 'signing secret not configured' });
    return true;
  }

  async _fire(ctx, event, req, res) {
    const dedupeKey = WebhookPresets.dedupeKeyFor(ctx.preset, { body: event.body, headers: req.headers, source: ctx.source });
    const fire = this._runner.fire(ctx.trigger.id, event, { kind: 'event', dedupeKey, source: 'webhook', remote: ctx.ip });
    if (!fire.accepted) return WebhookFireReply.refused(res, fire);
    fire.done.catch(() => {});
    if (fire.deferred) return WebhookFireReply.ack(res, ctx.preset, { deferred: true, resumesAt: fire.resumesAt });
    if (fire.batched) return WebhookFireReply.ack(res, ctx.preset, { batched: true, batchSize: fire.batchSize });
    if (ctx.source.respond !== 'result') return WebhookFireReply.ack(res, ctx.preset);
    return WebhookFireReply.result(res, fire, ctx.trigger, this._resultWaitMs);
  }

  _log(ctx, outcome, detail, event) {
    try {
      const row = this._store.recordDelivery(ctx.trigger.id, { source: 'webhook', outcome, detail, remote: ctx.ip, event });
      this._emit('delivery', { triggerId: ctx.trigger.id, deliveryId: row.id, outcome, detail });
    } catch (_) {}
  }
}

module.exports = WebhookDelivery;
