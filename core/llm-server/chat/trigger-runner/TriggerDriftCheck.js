const PayloadDrift = require('../triggers/PayloadDrift');
const TriggerFailurePolicy = require('../trigger-store/TriggerFailurePolicy');

class TriggerDriftCheck {
  constructor({ triggerStore, emitEvent = () => {}, notify = null }) {
    this._store = triggerStore;
    this._emitEvent = emitEvent;
    this._notify = notify;
  }

  note(trigger, event) {
    if (!trigger.sample || trigger.kind === 'page') return null;
    const drift = TriggerDriftCheck._driftOf(trigger, event);
    if (!drift) return null;
    if (!drift.drifted) {
      this._clear(trigger);
      return null;
    }
    const note = `shape drift: ${PayloadDrift.describe(drift)}`;
    const record = this._record(trigger, drift);
    this._emitEvent('drift', { triggerId: trigger.id, title: trigger.title || null, note, isNew: record.isNew });
    this._emitEvent('triggers-changed', { triggerId: trigger.id });
    if (record.isNew) this._notifyNew(trigger, drift);
    return note;
  }

  static _driftOf(trigger, event) {
    try {
      return PayloadDrift.driftOf(trigger.sample, event, trigger.kind);
    } catch (_) {
      return null;
    }
  }

  _clear(trigger) {
    if (!trigger.lastDrift) return;
    try { this._store.clearDrift(trigger.id); } catch (_) {}
    this._emitEvent('triggers-changed', { triggerId: trigger.id });
  }

  _record(trigger, drift) {
    try {
      return this._store.recordDrift(trigger.id, drift);
    } catch (_) {
      return { isNew: false };
    }
  }

  _notifyNew(trigger, drift) {
    if (!this._notify || !TriggerFailurePolicy.of(trigger).notifyFailures) return;
    this._notify({ kind: 'drift', triggerId: trigger.id, title: `Trigger payload changed: ${trigger.title || 'Trigger'}`, body: PayloadDrift.describe(drift) });
  }
}

module.exports = TriggerDriftCheck;
