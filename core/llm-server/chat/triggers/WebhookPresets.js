const crypto = require('crypto');

class WebhookPresets {
  static PRESETS = ['generic', 'slack', 'github'];
  static SLACK_MAX_SKEW_S = 5 * 60;

  static normalizePreset(preset) {
    return WebhookPresets.PRESETS.includes(preset) ? preset : 'generic';
  }

  static requiresSecret(preset, source = {}) {
    const p = WebhookPresets.normalizePreset(preset);
    if (p === 'slack' || p === 'github') return true;
    return !!(source && source.authHeader);
  }

  static verify(preset, { rawBody, headers = {}, secret, source = {}, now = Date.now() } = {}) {
    const raw = WebhookPresets._toBuffer(rawBody || '');
    const header = (name) => WebhookPresets._firstHeader(headers, name) || '';
    const p = WebhookPresets.normalizePreset(preset);
    if (p === 'slack') return WebhookPresets._verifySlack(raw, header, secret, now);
    if (p === 'github') return WebhookPresets._verifyGithub(raw, header, secret);
    return WebhookPresets._verifyGeneric(header, secret, source);
  }

  static dedupeKeyFor(preset, { body, headers = {}, source = {} } = {}) {
    const p = WebhookPresets.normalizePreset(preset);
    if (p === 'slack' && body && typeof body === 'object' && body.event_id) return `slack:${body.event_id}`;
    if (p === 'github') return WebhookPresets._prefixed('github', WebhookPresets._firstHeader(headers, 'x-github-delivery'));
    if (source && source.dedupeHeader) return WebhookPresets._prefixed('hdr', WebhookPresets._firstHeader(headers, source.dedupeHeader));
    return null;
  }

  static loopGuard(preset, body) {
    const b = body && typeof body === 'object' ? body : null;
    if (!b) return { skip: false };
    const p = WebhookPresets.normalizePreset(preset);
    if (p === 'slack') return WebhookPresets._slackLoopGuard(b);
    if (p === 'github') return WebhookPresets._githubLoopGuard(b);
    return { skip: false };
  }

  static ackResponse(preset) {
    if (WebhookPresets.normalizePreset(preset) === 'slack') return { status: 200, text: '' };
    return { status: 202, json: { accepted: true } };
  }

  static signSlack(secret, rawBody, ts = Math.floor(Date.now() / 1000)) {
    return {
      'x-slack-request-timestamp': String(ts),
      'x-slack-signature': WebhookPresets._slackSignature(secret, ts, WebhookPresets._toBuffer(rawBody)),
    };
  }

  static signGithub(secret, rawBody) {
    return { 'x-hub-signature-256': WebhookPresets._githubSignature(secret, WebhookPresets._toBuffer(rawBody)) };
  }

  static _verifySlack(raw, header, secret, now) {
    if (!secret) return WebhookPresets._fail('signing secret not configured');
    const ts = header('x-slack-request-timestamp');
    const signature = header('x-slack-signature');
    if (!ts || !signature) return WebhookPresets._fail('missing Slack signature headers');
    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum) || Math.abs(now / 1000 - tsNum) > WebhookPresets.SLACK_MAX_SKEW_S) {
      return WebhookPresets._fail('stale Slack request timestamp');
    }
    const expected = WebhookPresets._slackSignature(secret, ts, raw);
    return WebhookPresets._safeEqual(expected, signature) ? { ok: true } : WebhookPresets._fail('bad Slack signature');
  }

  static _verifyGithub(raw, header, secret) {
    if (!secret) return WebhookPresets._fail('webhook secret not configured');
    const signature = header('x-hub-signature-256');
    if (!signature) return WebhookPresets._fail('missing X-Hub-Signature-256');
    const expected = WebhookPresets._githubSignature(secret, raw);
    return WebhookPresets._safeEqual(expected, signature) ? { ok: true } : WebhookPresets._fail('bad GitHub signature');
  }

  static _verifyGeneric(header, secret, source) {
    if (!source || !source.authHeader) return { ok: true };
    if (!secret) return WebhookPresets._fail('auth token not configured');
    return WebhookPresets._safeEqual(header(source.authHeader), secret) ? { ok: true } : WebhookPresets._fail(`bad ${source.authHeader}`);
  }

  static _slackLoopGuard(body) {
    const ev = body.event && typeof body.event === 'object' ? body.event : null;
    if (!ev) return { skip: false };
    if (ev.bot_id) return { skip: true, reason: `Slack bot message (bot_id ${ev.bot_id})` };
    if (ev.subtype === 'bot_message') return { skip: true, reason: 'Slack bot_message subtype' };
    const ownUsers = Array.isArray(body.authorizations) ? body.authorizations.map((a) => a && a.user_id).filter(Boolean) : [];
    if (ev.user && ownUsers.includes(ev.user)) return { skip: true, reason: `message from this app's own user (${ev.user})` };
    return { skip: false };
  }

  static _githubLoopGuard(body) {
    const sender = body.sender && typeof body.sender === 'object' ? body.sender : null;
    if (sender && (sender.type === 'Bot' || /\[bot\]$/i.test(String(sender.login || '')))) {
      return { skip: true, reason: `GitHub bot sender (${sender.login || 'bot'})` };
    }
    return { skip: false };
  }

  static _slackSignature(secret, ts, raw) {
    return `v0=${WebhookPresets._hmacHex(secret, Buffer.concat([Buffer.from(`v0:${ts}:`, 'utf8'), raw]))}`;
  }

  static _githubSignature(secret, raw) {
    return `sha256=${WebhookPresets._hmacHex(secret, raw)}`;
  }

  static _hmacHex(secret, data) {
    return crypto.createHmac('sha256', String(secret)).update(data).digest('hex');
  }

  static _safeEqual(a, b) {
    const left = Buffer.from(String(a || ''), 'utf8');
    const right = Buffer.from(String(b || ''), 'utf8');
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  }

  static _firstHeader(headers, name) {
    const value = headers[String(name).toLowerCase()];
    if (value == null) return null;
    return String(Array.isArray(value) ? value[0] : value);
  }

  static _prefixed(prefix, value) {
    return value ? `${prefix}:${value}` : null;
  }

  static _toBuffer(body) {
    return Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
  }

  static _fail(error) {
    return { ok: false, error };
  }
}

module.exports = WebhookPresets;
