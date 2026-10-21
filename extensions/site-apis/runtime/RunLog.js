class RunLog {
  static VIA_PRIMARY = 'primary';
  static VIA_RECOVERED = 'recovered';
  static VIA_DIRECT = 'direct';
  static VIA_PAGE = 'page';
  static VIA_LOCAL = 'local';
  static VIA_LLM = 'llm';

  constructor({ now = () => Date.now() } = {}) {
    this._now = now;
    this.entries = [];
    this.healed = [];
    this.attempt = 1;
  }

  begin(index, kind) {
    const started = this._now();
    const entry = { index, kind, ok: false, ms: 0, via: null, attempt: this.attempt };
    this.entries.push(entry);
    return {
      end: (ok, { via = null, note = null, recoveryMs = null } = {}) => {
        entry.ok = !!ok;
        entry.ms = Math.max(0, this._now() - started);
        entry.via = via;
        if (note) entry.note = String(note);
        if (recoveryMs != null && Number.isFinite(Number(recoveryMs))) entry.recoveryMs = Number(recoveryMs);
        return entry;
      },
    };
  }

  heal(step, selector) {
    const existing = this.healed.find((item) => item.step === step);
    if (existing) existing.selector = selector;
    else this.healed.push({ step, selector });
  }

  nextAttempt() {
    this.attempt += 1;
  }

  toJSON() {
    return this.entries.map((entry) => ({ ...entry }));
  }
}

module.exports = RunLog;
