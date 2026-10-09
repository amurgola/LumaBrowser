const TriggerPayload = require('../triggers/TriggerPayload');
const TriggerCreateSource = require('./TriggerCreateSource');
const TriggerSummary = require('./TriggerSummary');
const TriggerTestOutcome = require('./TriggerTestOutcome');
const TriggerToolSpecs = require('./TriggerToolSpecs');
const TriggerUpdatePatch = require('./TriggerUpdatePatch');

class TriggerTools {
  static NO_TRIGGER = 'this conversation has no trigger yet; use create_trigger';
  static DISARMED_NOTE = 'The change disarmed the trigger; test it again, then arm it with enabled=true.';

  constructor({ triggerStore, services, emitEvent = () => {} }) {
    this._store = triggerStore;
    this._services = services;
    this._emit = emitEvent;
  }

  build() {
    return [
      { ...TriggerToolSpecs.create(), handler: (params, ctx) => this.create(params, ctx) },
      { ...TriggerToolSpecs.setSample(), handler: (params, ctx) => this.setSample(params, ctx) },
      { ...TriggerToolSpecs.test(), handler: (params, ctx) => this.test(params, ctx) },
      { ...TriggerToolSpecs.update(), handler: (params, ctx) => this.update(params, ctx) },
      { ...TriggerToolSpecs.rollback(), handler: (params, ctx) => this.rollback(params, ctx) },
    ];
  }

  async create(params = {}, ctx = {}) {
    const conversationId = ctx.conversationId;
    if (!conversationId) return { success: false, error: 'no conversation for this turn' };
    if (this._store.getByConversation(conversationId)) return { success: false, error: 'this conversation already has a trigger; use update_trigger' };
    const prompt = String(params.prompt || '').trim();
    if (!prompt) return { success: false, error: 'prompt is required' };
    const kind = TriggerCreateSource.kindOf(params);
    const built = TriggerCreateSource.build(kind, params, this._services);
    if (built.error) return { success: false, error: built.error };
    const agentPick = this._services.resolveAgentId(params.agent_id);
    if (agentPick.error) return { success: false, error: agentPick.error };
    let trigger;
    try {
      trigger = this._store.create({
        conversationId, title: params.title, kind, source: built.source,
        action: { mode: params.mode, prompt, expect: params.expect, artifactRootId: params.artifact_root_id, agentId: agentPick.agentId || undefined },
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
    this._services.syncConversationTitle(conversationId, trigger.title);
    this._emit('triggers-changed', { triggerId: trigger.id });
    return { success: true, trigger: this._summary(trigger), next: this._nextAfterCreate(trigger) };
  }

  async setSample(params = {}, ctx = {}) {
    const trigger = this._triggerFor(ctx);
    if (!trigger) return { success: false, error: TriggerTools.NO_TRIGGER };
    if (trigger.kind !== 'page' && (params.sample === undefined || params.sample === null)) return { success: false, error: 'sample is required' };
    let event;
    try {
      event = await this._sampleEvent(trigger, params.sample);
    } catch (err) {
      return { success: false, error: err.message };
    }
    const next = this._store.setSample(trigger.id, event);
    this._emit('triggers-changed', { triggerId: trigger.id });
    return { success: true, trigger: this._summary(next), next: 'Call test_trigger to run it.' };
  }

  async test(_params, ctx = {}) {
    const trigger = this._triggerFor(ctx);
    if (!trigger) return { success: false, error: TriggerTools.NO_TRIGGER };
    if (!trigger.sample) return { success: false, error: 'no sample event yet: send one real request to the webhook URL, or call set_sample' };
    const test = await this._runTest(trigger);
    return { success: true, test, trigger: this._summary(this._store.get(trigger.id)) };
  }

  async update(params = {}, ctx = {}) {
    const trigger = this._triggerFor(ctx);
    if (!trigger) return { success: false, error: TriggerTools.NO_TRIGGER };
    const built = TriggerUpdatePatch.build(trigger, params, this._services);
    if (built.error) return { success: false, error: built.error };
    if (params.clear_memory === true) this._store.clearMemory(trigger.id);
    const applied = await this._applyUpdate(trigger, built.patch, params);
    if (applied.error) return { success: false, error: applied.error, trigger: this._summary(this._store.get(trigger.id)), test: applied.test };
    const next = applied.next || this._store.get(trigger.id);
    if (built.patch.title) this._services.syncConversationTitle(ctx.conversationId, next.title);
    this._emit('triggers-changed', { triggerId: trigger.id });
    const result = { success: true, trigger: this._summary(next) };
    if (applied.test) result.test = applied.test;
    if (!next.enabled && trigger.enabled && !('enabled' in params)) result.note = TriggerTools.DISARMED_NOTE;
    return result;
  }

  async rollback(params = {}, ctx = {}) {
    const trigger = this._triggerFor(ctx);
    if (!trigger) return { success: false, error: TriggerTools.NO_TRIGGER };
    const r = this._store.rollbackTo(trigger.id, params.version);
    if (!r.success) {
      const versions = this._store.listVersions(trigger.id).map((v) => ({ n: v.n, at: v.at, tested: v.tested, current: v.current || undefined }));
      return { success: false, error: r.error, versions };
    }
    this._emit('triggers-changed', { triggerId: trigger.id });
    return { success: true, restored: r.restored, nowVersion: r.version, trigger: this._summary(r.trigger), note: TriggerTools._rollbackNote(r) };
  }

  async _applyUpdate(trigger, patch, params) {
    let next;
    let test;
    try {
      if (TriggerUpdatePatch.hasChanges(patch)) next = this._store.update(trigger.id, patch);
      if (params.run_test === true) test = await this._runTest(next || trigger);
      if (params.enabled !== undefined) next = this._store.update(trigger.id, { enabled: !!params.enabled });
    } catch (err) {
      return { error: err.message, test };
    }
    return { next, test };
  }

  async _sampleEvent(trigger, sample) {
    const runner = this._services.runner();
    if (runner && typeof runner.eventFor === 'function') return runner.eventFor(trigger, sample);
    return TriggerPayload.syntheticEvent(sample);
  }

  async _runTest(trigger) {
    const runner = this._services.runner();
    if (!runner) return { ran: false, error: 'runner not ready; try again shortly' };
    return TriggerTestOutcome.from(await runner.runInline(trigger.id, { kind: 'test' }));
  }

  _nextAfterCreate(trigger) {
    if (trigger.kind === 'file') {
      return 'The folder is now watched. Copy one matching file into it (the first event is captured as the '
        + 'sample, not run), or call set_sample with the path of a file already there. Then call test_trigger.';
    }
    if (trigger.kind === 'notification') {
      return 'The next notification inside the scope is captured as the sample (not run); it shows what the '
        + 'site really attaches (title, body, data). Or call set_sample with a representative text. Then call test_trigger.';
    }
    if (trigger.kind === 'page') {
      return 'The next detected change on that page is captured as the sample (not run), or call set_sample '
        + 'to use the monitor\'s latest check. Then call test_trigger.';
    }
    const secret = this._services.secretStatus(trigger);
    return (secret && secret.required && !secret.set ? 'Ask the user to enter the signing secret in the trigger\'s runs view (never in chat). ' : '')
      + 'Send one real request to a URL above (it is captured as the sample, not run), '
      + 'or call set_sample with a representative payload. Then call test_trigger.';
  }

  static _rollbackNote(r) {
    if (!r.restoredTest) return 'Restored an untested version; test it, then arm it.';
    return r.trigger.enabled ? 'Restored a tested version; the trigger stays armed.' : 'Restored a tested version; it can be armed at once with enabled=true.';
  }

  _triggerFor(ctx) {
    return ctx && ctx.conversationId ? this._store.getByConversation(ctx.conversationId) : null;
  }

  _summary(trigger) {
    return TriggerSummary.of(trigger, this._services);
  }
}

module.exports = TriggerTools;
