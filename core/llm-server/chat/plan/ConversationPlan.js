const PlanSteps = require('./PlanSteps');

class ConversationPlan {
  static META_KEY = 'plan';
  static EXPLANATION_MAX = 300;

  constructor(store, conversationId, now = () => new Date().toISOString()) {
    this._store = store;
    this._id = conversationId;
    this._now = now;
  }

  read() {
    try {
      const meta = this._store.getMeta(this._id);
      return ConversationPlan._hydrate(meta && meta.data && meta.data[ConversationPlan.META_KEY]);
    } catch (_) {
      return null;
    }
  }

  save(steps, explanation = null) {
    if (!Array.isArray(steps) || !steps.length) { this.clear(); return null; }
    const plan = { steps, explanation: ConversationPlan._explanation(explanation), updatedAt: this._now() };
    this._write(plan);
    return plan;
  }

  clear() {
    this._write(null);
  }

  retireFinished() {
    const plan = this.read();
    if (!plan || !PlanSteps.progress(plan.steps).done) return false;
    this.clear();
    return true;
  }

  _write(plan) {
    const meta = this._store.getMeta(this._id);
    const data = { ...((meta && meta.data) || {}) };
    if (plan) data[ConversationPlan.META_KEY] = plan;
    else if (ConversationPlan.META_KEY in data) delete data[ConversationPlan.META_KEY];
    else return;
    this._store.setMeta(this._id, { data });
  }

  static _hydrate(stored) {
    if (!stored || typeof stored !== 'object') return null;
    const steps = PlanSteps.normalize(stored.steps);
    if (!steps || !steps.length) return null;
    return { steps, explanation: ConversationPlan._explanation(stored.explanation), updatedAt: stored.updatedAt || null };
  }

  static _explanation(text) {
    const line = typeof text === 'string' ? text.trim() : '';
    return line ? line.slice(0, ConversationPlan.EXPLANATION_MAX) : null;
  }
}

module.exports = ConversationPlan;
