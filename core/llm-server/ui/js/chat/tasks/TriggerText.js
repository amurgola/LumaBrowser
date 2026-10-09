export default class TriggerText {
  static DELIVERY_DOT = {
    fired: 'ok', captured: 'ok', handshake: 'ok', queued: 'running', batched: 'running', retry_scheduled: 'running', deferred: 'running',
    duplicate: 'warn', unarmed: 'warn', rate_limited: 'warn', filtered: 'warn', cooldown: 'warn', quiet: 'warn',
    rejected: 'error', no_secret: 'error', queue_dropped: 'error', dropped: 'error', error: 'error',
  };

  static DELIVERY_LABEL = {
    fired: 'fired', captured: 'captured as sample', handshake: 'handshake', queued: 'queued', batched: 'in batch', retry_scheduled: 'retry scheduled', deferred: 'held (quiet hours)',
    duplicate: 'duplicate', unarmed: 'not armed', rate_limited: 'rate limited', filtered: 'filtered out', cooldown: 'cooldown', quiet: 'quiet hours',
    rejected: 'rejected', no_secret: 'secret not set', queue_dropped: 'queue full', dropped: 'dropped', error: 'failed',
  };

  static suffix(t) {
    switch (t.status) {
      case 'awaiting_sample': return ' (listening)';
      case 'needs_test': case 'tested': return ' (unarmed)';
      case 'armed': return '';
      case 'auto_paused': return ' (paused: failures)';
      default: return t.enabled ? '' : ' (paused)';
    }
  }

  static statusLabel(t) {
    switch (t.status) {
      case 'awaiting_sample': return 'Awaiting sample';
      case 'needs_test': return 'Needs test';
      case 'tested': return 'Tested, unarmed';
      case 'armed': return 'Armed';
      case 'auto_paused': return 'Paused after failures';
      default: return t.status || '';
    }
  }

  static urls(t, baseUrls) {
    const out = [];
    if (!t || !t.hookToken || !baseUrls) return out;
    for (const key of ['public', 'lan', 'local']) {
      if (baseUrls[key]) out.push({ key, url: String(baseUrls[key]).replace(/\/+$/, '') + '/hooks/' + t.hookToken });
    }
    return out;
  }

  static curl(url, sample) {
    const body = sample && sample.body != null ? JSON.stringify(sample.body) : '{"text": "hello world"}';
    return "curl -X POST '" + url + "' \\\n  -H 'Content-Type: application/json' \\\n  -d '" + body.replace(/'/g, "'\\''") + "'";
  }

  static prettyEvent(ev) {
    if (ev == null) return '';
    try { return JSON.stringify(ev, null, 2); } catch (_) { return String(ev); }
  }

  static deliveryLabel(outcome) {
    return TriggerText.DELIVERY_LABEL[outcome] || outcome;
  }

  static deliveryDot(outcome) {
    return TriggerText.DELIVERY_DOT[outcome] || 'running';
  }
}
