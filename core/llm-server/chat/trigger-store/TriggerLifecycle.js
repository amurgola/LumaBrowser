const crypto = require('crypto');

class TriggerLifecycle {
  static configHash(trigger) {
    const action = (trigger && trigger.action) || {};
    const source = (trigger && trigger.source) || {};
    const canon = JSON.stringify({
      kind: trigger && trigger.kind,
      mode: action.mode,
      prompt: action.prompt,
      respond: source.respond,
      allowWrite: source.allowWrite,
      expect: action.expect || undefined,
      agentId: action.agentId || undefined,
      artifactRootId: action.artifactRootId || undefined,
    });
    return crypto.createHash('sha256').update(canon).digest('hex');
  }

  static isArmable(trigger) {
    const lastTest = trigger && trigger.lastTest;
    return !!(lastTest && lastTest.ok && lastTest.configHash === TriggerLifecycle.configHash(trigger));
  }

  static statusOf(trigger) {
    if (!trigger) return 'unknown';
    if (trigger.enabled) return 'armed';
    if (trigger.pausedReason) return 'auto_paused';
    if (!trigger.sample) return 'awaiting_sample';
    return TriggerLifecycle.isArmable(trigger) ? 'tested' : 'needs_test';
  }
}

module.exports = TriggerLifecycle;
