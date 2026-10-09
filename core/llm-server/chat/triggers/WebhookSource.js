const express = require('express');
const IpClass = require('../../../shared/net/IpClass');
const TriggerStore = require('../TriggerStore');
const WindowCounter = require('./webhook/WindowCounter');
const WebhookDelivery = require('./webhook/WebhookDelivery');

class WebhookSource {
  static BODY_LIMIT = '1mb';
  static RATE_PER_MIN = 60;
  static LOCKOUT_FAILS = 10;
  static LOCKOUT_WINDOW_MS = 10 * 60 * 1000;
  static RESULT_WAIT_MS = 25 * 1000;

  constructor({ triggerStore, runner, emitEvent = () => {}, resultWaitMs = WebhookSource.RESULT_WAIT_MS, secrets = null } = {}) {
    if (!triggerStore || !runner) throw new Error('WebhookSource needs triggerStore + runner');
    this._store = triggerStore;
    this._fails = new WindowCounter(WebhookSource.LOCKOUT_WINDOW_MS);
    this._delivery = new WebhookDelivery({
      triggerStore,
      runner,
      secrets,
      emitEvent,
      rate: new WindowCounter(60 * 1000),
      fails: this._fails,
      ratePerMin: WebhookSource.RATE_PER_MIN,
      resultWaitMs,
    });
    this._router = null;
  }

  router() {
    if (!this._router) this._router = this._buildRouter();
    return this._router;
  }

  _buildRouter() {
    const router = express.Router();
    router.use(express.raw({ type: () => true, limit: WebhookSource.BODY_LIMIT }));
    router.use('/:token', (req, res, next) => this._tokenGate(req, res, next));
    router.get('/:token/runs/:runId', (req, res) => this._pollRun(req, res));
    const deliver = (req, res) => this._delivery.handle(req, res);
    router.post('/:token', deliver);
    router.put('/:token', deliver);
    router.patch('/:token', deliver);
    router.all('/:token', (_req, res) => res.status(405).json({ error: 'send a POST' }));
    return router;
  }

  _tokenGate(req, res, next) {
    const ip = IpClass.clientIp(req) || 'unknown';
    if (this._fails.count(ip) >= WebhookSource.LOCKOUT_FAILS) return WebhookSource._notFound(res);
    const token = String(req.params.token || '');
    const trigger = TriggerStore.HOOK_TOKEN_RE.test(token) ? this._store.getByToken(token) : null;
    if (!trigger) {
      this._fails.hit(ip);
      return WebhookSource._notFound(res);
    }
    req.trigger = trigger;
    return next();
  }

  _pollRun(req, res) {
    const run = this._store.getRun(String(req.params.runId || ''));
    if (!run || run.triggerId !== req.trigger.id) return WebhookSource._notFound(res);
    return res.json({ runId: run.id, status: run.status, response: run.response, error: run.error, completedAt: run.completedAt });
  }

  static _notFound(res) {
    return res.status(404).type('text').send('Not found');
  }
}

module.exports = WebhookSource;
