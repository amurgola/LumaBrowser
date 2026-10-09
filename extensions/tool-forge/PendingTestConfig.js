class PendingTestConfig {
  constructor() {
    this._byTool = new Map();
  }

  remember(tool, codeHash, overrides) {
    const values = PendingTestConfig._declaredValues(tool, overrides);
    if (Object.keys(values).length) this._byTool.set(tool.name, { codeHash, values });
    else this._byTool.delete(tool.name);
  }

  take(toolName, codeHash) {
    const pending = this._byTool.get(toolName);
    this._byTool.delete(toolName);
    return pending && pending.codeHash === codeHash ? pending.values : null;
  }

  static _declaredValues(tool, overrides) {
    const slotKeys = new Set((tool.configSlots || []).map((slot) => slot.key));
    const values = {};
    for (const [key, value] of Object.entries(overrides || {})) {
      if (slotKeys.has(key) && value != null && String(value) !== '') values[key] = String(value);
    }
    return values;
  }
}

module.exports = PendingTestConfig;
