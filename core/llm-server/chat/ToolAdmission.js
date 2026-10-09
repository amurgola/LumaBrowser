class ToolAdmission {
  static admitNewTools({ dynamicTools, known, policy }) {
    if (policy === undefined) return { admitted: [] };
    const allowed = Array.isArray(policy) ? new Set(policy) : null;
    const admitted = ToolAdmission._asList(dynamicTools)
      .filter((tool) => ToolAdmission._isAdmissible(tool, known, allowed));
    return { admitted };
  }

  static _asList(tools) {
    return Array.isArray(tools) ? tools : [];
  }

  static _isAdmissible(tool, known, allowed) {
    if (!tool || !tool.name || known.has(tool.name)) return false;
    return !allowed || allowed.has(tool.name);
  }
}

module.exports = ToolAdmission;
