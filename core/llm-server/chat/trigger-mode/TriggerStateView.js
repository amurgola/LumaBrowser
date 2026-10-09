const TriggerStore = require('../TriggerStore');
const TriggerFacts = require('./TriggerFacts');

class TriggerStateView {
  static VERSION_PROMPT_CHARS = 160;
  static BOT_GUARD_PRESETS = ['slack', 'github'];
  static DRIFT_NOTE = 'live events no longer match the tested sample; the prompt may read fields that are gone. Offer to update the prompt and adopt the new shape (the user can click "Use latest as sample" on the card, or you can call set_sample)';

  static build(trigger, extras = {}, bases = null) {
    const action = trigger.action || {};
    return {
      title: trigger.title,
      kind: trigger.kind,
      status: trigger.status,
      statusMeaning: TriggerFacts.describeStatus(trigger.status, trigger.kind),
      mode: action.mode,
      agent: TriggerFacts.agent(trigger, extras.agents),
      ...TriggerStateView._webhookFacts(trigger, extras),
      watch: TriggerFacts.watch(trigger) || undefined,
      page: trigger.kind === 'page' ? TriggerFacts.page(trigger) : undefined,
      notification: TriggerFacts.notification(trigger),
      expect: action.expect || undefined,
      artifactRootId: action.artifactRootId || undefined,
      gating: TriggerFacts.gating(trigger) || undefined,
      memory: TriggerStateView._memory(trigger),
      failures: TriggerFacts.failures(trigger),
      approval: TriggerStore.approvalPolicy(trigger),
      pendingApproval: extras.pendingApproval || undefined,
      drift: TriggerStateView._drift(trigger),
      prompt: action.prompt,
      versions: TriggerStateView._versions(extras.versions),
      enabled: trigger.enabled,
      urls: TriggerFacts.hookUrls(trigger, bases) || undefined,
      hasSample: !!trigger.sample,
      lastTest: TriggerStateView._lastTest(trigger),
      fireCount: trigger.fireCount,
      lastFiredAt: trigger.lastFiredAt || null,
      lastStatus: trigger.lastStatus || null,
    };
  }

  static _webhookFacts(trigger, extras) {
    if (trigger.kind !== 'webhook') return { respond: undefined, preset: undefined, botGuard: undefined, secret: undefined };
    const source = trigger.source || {};
    return {
      respond: source.respond,
      preset: source.preset,
      botGuard: TriggerStateView.BOT_GUARD_PRESETS.includes(source.preset) ? source.botGuard !== false : undefined,
      secret: extras.secret || undefined,
    };
  }

  static _memory(trigger) {
    const memory = trigger.source && trigger.source.memory;
    if (!memory) return undefined;
    return { runs: memory.runs, notes: trigger.memory || null, updatedAt: trigger.memoryAt || null };
  }

  static _drift(trigger) {
    const drift = trigger.lastDrift;
    if (!drift) return undefined;
    return {
      note: TriggerStateView.DRIFT_NOTE,
      missing: drift.missing,
      typeChanged: drift.typeChanged,
      added: drift.added,
      seen: drift.count,
      since: drift.firstAt,
    };
  }

  static _versions(versions) {
    if (!Array.isArray(versions) || !versions.length) return undefined;
    return versions.map((v) => ({
      n: v.n,
      at: v.at,
      origin: v.origin,
      tested: v.tested,
      current: v.current || undefined,
      note: v.note || undefined,
      mode: v.action && v.action.mode,
      prompt: v.current ? undefined : TriggerFacts.oneLine(String((v.action && v.action.prompt) || ''), TriggerStateView.VERSION_PROMPT_CHARS),
    }));
  }

  static _lastTest(trigger) {
    const test = trigger.lastTest;
    return test ? { ok: test.ok, at: test.at, error: test.error || undefined } : null;
  }
}

module.exports = TriggerStateView;
