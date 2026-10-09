const TriggerFailurePolicy = require('../trigger-store/TriggerFailurePolicy');

class TriggerFailureNotifier {
  static BODY_PREVIEW_CHARS = 200;

  constructor({ triggerStore, emitEvent = () => {}, notify = null }) {
    this._store = triggerStore;
    this._emitEvent = emitEvent;
    this._notify = notify;
  }

  afterFire(trigger, status, errorText) {
    const streak = this._store.recordFire(trigger.id, { status, error: errorText });
    if (status !== 'error') return streak;
    const policy = TriggerFailurePolicy.of(trigger);
    const title = trigger.title || 'Trigger';
    if (streak.autoPaused) this._announcePause(trigger, title, streak, policy);
    else if (streak.firstFailure) this._notifyFailure(trigger, title, errorText, policy);
    return streak;
  }

  _announcePause(trigger, title, streak, policy) {
    this._emitEvent('auto-paused', { triggerId: trigger.id, title, reason: streak.pausedReason, consecutiveFailures: streak.consecutiveFailures });
    this._emitEvent('triggers-changed', { triggerId: trigger.id });
    if (this._notify && policy.notifyFailures) {
      this._notify({ kind: 'auto-paused', triggerId: trigger.id, title: `Trigger paused: ${title}`, body: streak.pausedReason });
    }
  }

  _notifyFailure(trigger, title, errorText, policy) {
    if (!this._notify || !policy.notifyFailures) return;
    const left = policy.autoPauseAfter > 0 ? ` (pauses after ${policy.autoPauseAfter} in a row)` : '';
    const body = String(errorText || 'unknown error').slice(0, TriggerFailureNotifier.BODY_PREVIEW_CHARS) + left;
    this._notify({ kind: 'failed', triggerId: trigger.id, title: `Trigger run failed: ${title}`, body });
  }
}

module.exports = TriggerFailureNotifier;
