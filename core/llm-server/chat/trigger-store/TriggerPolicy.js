class TriggerPolicy {
  static normalizeInto(_source, _out) {
    throw new Error(`${this.name}.normalizeInto is not implemented`);
  }

  static of(_trigger) {
    throw new Error(`${this.name}.of is not implemented`);
  }

  static sourceOf(trigger) {
    return (trigger && trigger.source) || {};
  }

  static clampedInt(value, min, max) {
    if (value === undefined || value === null) return null;
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
  }
}

module.exports = TriggerPolicy;
