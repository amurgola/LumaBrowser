const TriggerApprovalPolicy = require('../trigger-store/TriggerApprovalPolicy');

class TriggerApprovalHold {
  static DECISIONS = { allow: 'once', allow_run: 'run', allow_always: 'run', deny: 'reject' };
  static PARAMS_PREVIEW_CHARS = 400;

  constructor({ triggerStore, emitEvent = () => {}, notify = null, getBridge }) {
    this._store = triggerStore;
    this._emitEvent = emitEvent;
    this._notify = notify;
    this._getBridge = getBridge;
    this._parked = null;
  }

  pending(triggerId) {
    const p = this._parked;
    if (!p || (triggerId && p.triggerId !== triggerId)) return null;
    return { runId: p.runId, triggerId: p.triggerId, tool: p.tool, detail: p.detail, since: p.since, params: p.paramsPreview };
  }

  approve(runId, decision) {
    const p = this._parked;
    if (!p || p.runId !== runId) return { success: false, error: 'nothing is waiting for approval on that run' };
    const d = String(decision || '');
    const bridgeDecision = TriggerApprovalHold.DECISIONS[d];
    if (!Object.prototype.hasOwnProperty.call(TriggerApprovalHold.DECISIONS, d)) {
      return { success: false, error: 'decision must be allow, allow_run, allow_always or deny' };
    }
    if (d === 'allow_always') this._rememberTool(p);
    if (!this._answerBridge(bridgeDecision)) return { success: false, error: 'the run is no longer waiting' };
    return { success: true, decision: d, tool: p.tool };
  }

  onRequest(trigger, runId, ev, control) {
    const fresh = this._store.get(trigger.id) || trigger;
    const title = trigger.title || 'Trigger';
    if (TriggerApprovalPolicy.of(fresh).approvedTools.includes(ev.tool)) {
      this._autoAllow(trigger, runId, ev, title);
      return;
    }
    this._park(trigger, runId, ev);
    if (control) { try { control.pause(); } catch (_) {} }
    this._emitEvent('approval-needed', { triggerId: trigger.id, runId: this._parked.runId, tool: ev.tool, detail: this._parked.detail, title });
    if (this._notify) {
      this._notify({ kind: 'approval', triggerId: trigger.id, title: `Trigger needs your approval: ${title}`, body: this._parked.detail });
    }
  }

  onDone(trigger, runId, ev, control) {
    const wasParked = !!(this._parked && this._parked.triggerId === trigger.id);
    this._parked = null;
    if (wasParked && control) { try { control.resume(); } catch (_) {} }
    this._emitEvent('approval-done', { triggerId: trigger.id, runId, tool: ev.tool, decision: ev.decision, title: trigger.title || null });
  }

  clearFor(triggerId) {
    if (this._parked && this._parked.triggerId === triggerId) this._parked = null;
  }

  _autoAllow(trigger, runId, ev, title) {
    setTimeout(() => { this._answerBridge('run'); }, 0);
    this._emitEvent('approval-auto', { triggerId: trigger.id, runId, tool: ev.tool, title });
  }

  _park(trigger, runId, ev) {
    this._parked = {
      triggerId: trigger.id, runId, tool: ev.tool, detail: ev.detail || ev.tool,
      paramsPreview: TriggerApprovalHold._paramsPreview(ev.params), since: new Date().toISOString(),
    };
  }

  _rememberTool(parked) {
    try { this._store.approveTool(parked.triggerId, parked.tool); } catch (_) {}
    this._emitEvent('triggers-changed', { triggerId: parked.triggerId });
  }

  _answerBridge(decision) {
    try {
      const bridge = this._getBridge();
      return !!(bridge && typeof bridge.respondApproval === 'function' && bridge.respondApproval(decision));
    } catch (_) {
      return false;
    }
  }

  static _paramsPreview(params) {
    try {
      return JSON.stringify(params || {}).slice(0, TriggerApprovalHold.PARAMS_PREVIEW_CHARS);
    } catch (_) {
      return '';
    }
  }
}

module.exports = TriggerApprovalHold;
