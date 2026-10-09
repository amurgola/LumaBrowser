const WebhookPresets = require('../WebhookPresets');

class WebhookFireReply {
  static POLICY_REPLIES = {
    'duplicate delivery': () => ({ accepted: true, duplicate: true }),
    filtered: (fire) => ({ accepted: false, filtered: true, failed: fire.filtered }),
    cooldown: (fire) => ({ accepted: false, cooldown: true, retryAfterSeconds: fire.retryAfterS }),
    quiet_hours: (fire) => ({ accepted: false, quiet: true, resumesAt: fire.resumesAt }),
  };

  static refused(res, fire) {
    const reply = WebhookFireReply.POLICY_REPLIES[fire.reason];
    if (reply) return res.status(200).json(reply(fire));
    return res.status(503).json({ error: fire.reason || 'not accepted' });
  }

  static ack(res, preset, extra = null) {
    const ack = WebhookPresets.ackResponse(preset);
    if (ack.json) return res.status(ack.status).json(extra ? { ...ack.json, ...extra } : ack.json);
    return res.status(ack.status).type('text').send(ack.text || '');
  }

  static async result(res, fire, trigger, waitMs) {
    const run = await WebhookFireReply._raceTimeout(fire.done, waitMs);
    if (run === undefined) {
      return res.status(202).json({ accepted: true, pending: true, pollPath: `/hooks/${trigger.hookToken}/runs` });
    }
    if (!run) return res.status(503).json({ error: 'run was dropped' });
    return WebhookFireReply._runOutcome(res, run);
  }

  static _runOutcome(res, run) {
    const code = run.status === 'ok' ? 200 : (run.shapeError ? 422 : 500);
    if (run.responseBody !== undefined && !run.shapeError) {
      if (typeof run.responseBody === 'string') return res.status(code).type('text').send(run.responseBody);
      return res.status(code).json(run.responseBody);
    }
    return res.status(code).json({ runId: run.id, status: run.status, response: run.response, error: run.error });
  }

  static async _raceTimeout(promise, waitMs) {
    let timer = null;
    const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(undefined), waitMs); });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = WebhookFireReply;
