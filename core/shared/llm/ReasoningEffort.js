class ReasoningEffort {
  static LEVELS = ['default', 'low', 'medium', 'high', 'xhigh'];

  static LADDER = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

  static COMMON_LEVELS = ['low', 'medium', 'high', 'xhigh'];

  static AGENT_DEFAULT = 'low';

  static DIAL_POSITIONS = [
    { id: 'off', short: 'Off', label: 'Off - answer immediately, no reasoning' },
    { id: 'default', short: 'Auto', label: 'Auto - whatever the model does by default' },
    { id: 'low', short: 'Low', label: 'Low - shortest reasoning, fastest replies' },
    { id: 'medium', short: 'Med', label: 'Medium - balanced' },
    { id: 'high', short: 'High', label: 'High - longer reasoning' },
    { id: 'xhigh', short: 'Max', label: 'Max - longest reasoning, for work you walk away from' },
  ];

  static DIAL_IDS = ReasoningEffort.DIAL_POSITIONS.map((position) => position.id);

  static normalizeDial(position) {
    const id = ReasoningEffort._normalizeText(position);
    return ReasoningEffort.DIAL_IDS.includes(id) ? id : 'default';
  }

  static normalizeEffort(level) {
    const id = ReasoningEffort._normalizeText(level);
    return ReasoningEffort.LEVELS.includes(id) ? id : 'default';
  }

  static extraFor(level) {
    const normalized = ReasoningEffort.normalizeEffort(level);
    if (normalized === 'default') return null;
    return { chatTemplateKwargs: { reasoning_effort: normalized } };
  }

  static resolveDial({ turn, conversation, fallback } = {}) {
    const chosen = [turn, conversation, fallback].find((layer) => !ReasoningEffort._isAbsent(layer));
    return chosen === undefined ? 'default' : ReasoningEffort.normalizeDial(chosen);
  }

  static nearestEffort(level, levels) {
    const requested = ReasoningEffort._normalizeText(level);
    if (!requested || requested === 'default') return null;
    const available = Array.isArray(levels) ? levels : ReasoningEffort.COMMON_LEVELS;
    if (!available.length) return null;
    if (available.includes(requested)) return requested;
    return ReasoningEffort._nearestRung(requested, available);
  }

  static dialPositionsFor(thinking) {
    const probed = !!(thinking && thinking.source === 'probe');
    const levels = probed && Array.isArray(thinking.effortLevels) ? thinking.effortLevels : null;
    return ReasoningEffort.DIAL_POSITIONS.map((position) => {
      const reason = probed ? ReasoningEffort._disabledReason(position, thinking, levels) : null;
      return reason ? { ...position, enabled: false, reason } : { ...position, enabled: true };
    });
  }

  static _nearestRung(requested, available) {
    const ladder = ReasoningEffort.LADDER;
    const index = ladder.indexOf(requested);
    if (index < 0) return null;
    const up = ladder.slice(index + 1).find((rung) => available.includes(rung));
    if (up) return up;
    const down = ladder.slice(0, index).reverse().find((rung) => available.includes(rung));
    return down || null;
  }

  static _disabledReason(position, thinking, levels) {
    if (position.id === 'off') return ReasoningEffort._offReason(thinking, levels);
    if (position.id === 'default') return null;
    return ReasoningEffort._levelReason(position, levels);
  }

  static _offReason(thinking, levels) {
    if (thinking.thinkingFixed) {
      return 'This model always reasons. Its chat template has no way to turn thinking off.';
    }
    const hasControl = thinking.supportsThinkingToggle || thinking.disableKwarg || (levels && levels.length);
    return hasControl ? null : 'This model has no thinking control to turn off.';
  }

  static _levelReason(position, levels) {
    if (!levels || !levels.length) {
      return 'This model has no effort levels. Its template only turns thinking on or off.';
    }
    if (levels.includes(position.id)) return null;
    return `This model's template has no ${position.short} setting. It offers: ${levels.join(', ')}.`;
  }

  static _normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  static _isAbsent(value) {
    return value === null || value === undefined || value === '';
  }
}

module.exports = ReasoningEffort;
