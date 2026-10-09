class McpToolNaming {
  static EXTENSION_ID = 'mcp-connector';
  static MAX_TOOL_NAME = 60;

  static slugify(name) {
    return String(name || 'server').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'server';
  }

  static makeToolName(serverSlug, toolName, taken) {
    const base = McpToolNaming._base(serverSlug, toolName);
    let name = base;
    for (let n = 2; taken.has(name); n++) {
      const suffix = `_${n}`;
      name = base.slice(0, McpToolNaming.MAX_TOOL_NAME - suffix.length) + suffix;
    }
    taken.add(name);
    return name;
  }

  static _base(serverSlug, toolName) {
    const base = `mcp__${serverSlug}__${String(toolName).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    return base.slice(0, McpToolNaming.MAX_TOOL_NAME);
  }
}

module.exports = McpToolNaming;
