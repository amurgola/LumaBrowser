class AiToolList {
  static MAX_TOOLS = 24;
  static NAME_RE = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;
  static MAX_DESCRIPTION = 500;

  static normalize(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    const seen = new Set();
    for (const tool of raw.slice(0, AiToolList.MAX_TOOLS)) {
      if (!tool || typeof tool !== 'object') continue;
      const name = String(tool.name || '').trim();
      if (!AiToolList.NAME_RE.test(name) || seen.has(name)) continue;
      seen.add(name);
      out.push(AiToolList._entry(name, tool));
    }
    return out;
  }

  static _entry(name, tool) {
    return {
      name,
      description: String(tool.description || '').slice(0, AiToolList.MAX_DESCRIPTION),
      parameters: tool.parameters && typeof tool.parameters === 'object' ? tool.parameters : { type: 'object', properties: {} },
    };
  }
}

module.exports = AiToolList;
