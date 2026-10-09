const TriggerStore = require('../TriggerStore');

class TriggerFacts {
  static oneLine(text, max) {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
  }

  static describeStatus(status, kind = 'webhook') {
    switch (status) {
      case 'awaiting_sample': return TriggerFacts._awaitingSample(kind);
      case 'needs_test': return 'has a sample but the current configuration has not passed a test (call test_trigger)';
      case 'tested': return 'tested and ready to arm (call update_trigger with enabled true)';
      case 'armed': return TriggerFacts._armed(kind);
      case 'auto_paused': return 'PAUSED AUTOMATICALLY after repeated failed runs (see pausedReason); fix the cause (prompt, tools, secret, folder), test, then resume with update_trigger enabled=true';
      default: return status;
    }
  }

  static hookUrls(trigger, bases) {
    if (!trigger || !trigger.hookToken || !bases) return null;
    const out = {};
    for (const [key, base] of Object.entries(bases)) {
      if (base) out[key] = String(base).replace(/\/+$/, '') + '/hooks/' + trigger.hookToken;
    }
    return out;
  }

  static gating(trigger) {
    const s = (trigger && trigger.source) || {};
    const out = {};
    if (s.filter) out.filter = s.filter;
    if (s.cooldownMs) out.cooldownSeconds = Math.round(s.cooldownMs / 1000);
    if (s.batch) out.batch = { seconds: Math.round(s.batch.windowMs / 1000), max: s.batch.max };
    if (s.quietHours) out.quietHours = s.quietHours;
    if (s.memory) out.memory = { runs: s.memory.runs, maxChars: s.memory.maxChars };
    return Object.keys(out).length ? out : null;
  }

  static failures(trigger) {
    const policy = TriggerStore.failurePolicy(trigger);
    const out = {
      autoPauseAfter: policy.autoPauseAfter,
      notifyFailures: policy.notifyFailures,
      retryMax: policy.retryMax,
      retryBackoffSeconds: Math.round(policy.retryBackoffMs / 1000),
    };
    if (trigger.consecutiveFailures) out.consecutiveFailures = trigger.consecutiveFailures;
    if (trigger.pausedReason) out.pausedReason = trigger.pausedReason;
    return out;
  }

  static watch(trigger) {
    if (!trigger || trigger.kind !== 'file' || !trigger.source) return null;
    const s = trigger.source;
    return { dir: s.dir, glob: s.glob, events: s.events, recursive: !!s.recursive, allowWrite: !!s.allowWrite };
  }

  static page(trigger) {
    const s = trigger.source || {};
    return { monitorId: s.monitorId, url: s.url, name: s.name };
  }

  static notification(trigger) {
    if (!trigger || trigger.kind !== 'notification' || !trigger.source) return undefined;
    const s = trigger.source;
    const out = {};
    if (s.host) out.host = s.host;
    if (s.tabPartition) out.tab = { partition: s.tabPartition, title: s.tabTitle || undefined, url: s.tabUrl || undefined };
    return out;
  }

  static agent(trigger, agents) {
    const id = trigger && trigger.action && trigger.action.agentId;
    if (!id) return undefined;
    const hit = Array.isArray(agents) ? agents.find((a) => a.id === id) : null;
    if (hit) return { id, name: hit.name };
    return { id, missing: true, note: 'this agent no longer exists; runs fail until another is chosen or agent_id is cleared' };
  }

  static _awaitingSample(kind) {
    if (kind === 'file') return 'awaiting a sample event (copy a matching file into the folder, or call set_sample with the path of an existing file there)';
    if (kind === 'notification') return 'awaiting a sample notification (the next matching notification is captured, or call set_sample with the text)';
    return 'awaiting a sample event (send one real request to the URL, or call set_sample)';
  }

  static _armed(kind) {
    if (kind === 'file') return 'ARMED: matching file events run';
    if (kind === 'notification') return 'ARMED: matching notifications run';
    return 'ARMED: real deliveries run';
  }
}

module.exports = TriggerFacts;
