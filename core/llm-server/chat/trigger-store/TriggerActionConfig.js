class TriggerActionConfig {
  static MODES = ['prompt', 'agent'];
  static CLEARABLE_KEYS = ['expect', 'artifactRootId', 'agentId'];

  static normalize(action = {}) {
    const a = action && typeof action === 'object' ? action : {};
    const prompt = String(a.prompt || '').trim();
    if (!prompt) throw new Error('a trigger needs a prompt');
    const out = { mode: TriggerActionConfig.MODES.includes(a.mode) ? a.mode : 'agent', prompt };
    if (TriggerActionConfig._isNonEmptyObject(a.expect)) out.expect = a.expect;
    const artifactRootId = TriggerActionConfig._trimmed(a.artifactRootId);
    if (artifactRootId) out.artifactRootId = artifactRootId;
    const agentId = TriggerActionConfig._trimmed(a.agentId);
    if (out.mode === 'agent' && agentId) out.agentId = agentId;
    return out;
  }

  static merge(current, patch) {
    const merged = { ...current, ...patch };
    for (const key of TriggerActionConfig.CLEARABLE_KEYS) if (patch[key] === null) delete merged[key];
    return merged;
  }

  static _isNonEmptyObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
  }

  static _trimmed(value) {
    return value ? String(value).trim() : '';
  }
}

module.exports = TriggerActionConfig;
