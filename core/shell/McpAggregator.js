class McpAggregator {
  constructor() {
    this._toolSets = new Map();
    this._disabledTools = new Set();
  }

  registerCore(sourceId, toolSet) {
    this._toolSets.set(sourceId, toolSet);
    console.log(`McpAggregator: registered core tools from "${sourceId}": [${McpAggregator._toolNames(toolSet).join(', ')}]`);
  }

  registerExtension(extensionId, toolSet) {
    this._toolSets.set(McpAggregator._extensionSource(extensionId), toolSet);
    console.log(`McpAggregator: registered extension tools from "${extensionId}": [${McpAggregator._toolNames(toolSet).join(', ')}]`);
  }

  unregisterExtension(extensionId) {
    this._toolSets.delete(McpAggregator._extensionSource(extensionId));
    console.log(`McpAggregator: unregistered extension tools from "${extensionId}"`);
  }

  setDisabledTools(toolNames) {
    this._disabledTools = new Set(toolNames);
  }

  getAllTools() {
    return this._entries()
      .filter(({ tool }) => !this._disabledTools.has(tool.name))
      .map(({ tool }) => tool);
  }

  getRegisteredTools() {
    return this._entries().map(({ sourceId, tool }) => ({
      name: tool.name,
      description: tool.description || '',
      inputSchema: tool.inputSchema || null,
      source: sourceId,
    }));
  }

  getToolDefinitions() {
    const definitions = new Map();
    for (const { tool } of this._entries()) {
      if (tool && tool.name && !definitions.has(tool.name)) definitions.set(tool.name, tool);
    }
    return definitions;
  }

  getAvailableToolsList() {
    return this._entries().map(({ sourceId, tool }) => ({
      name: tool.name,
      description: tool.description || '',
      source: sourceId,
      enabled: !this._disabledTools.has(tool.name),
    }));
  }

  getStats() {
    const stats = {};
    for (const [sourceId, toolSet] of this._toolSets) {
      stats[sourceId] = (toolSet.tools && toolSet.tools.length) || 0;
    }
    return stats;
  }

  async handleToolCall(toolName, args, opts = {}) {
    if (!opts.ignoreDisabled && this._disabledTools.has(toolName)) {
      throw new Error(`McpAggregator: tool "${toolName}" is disabled`);
    }
    const toolSet = this._ownerOf(toolName);
    if (!toolSet) throw new Error(`McpAggregator: unknown tool "${toolName}"`);
    return toolSet.handler(toolName, args, opts);
  }

  _ownerOf(toolName) {
    for (const toolSet of this._toolSets.values()) {
      const owns = Array.isArray(toolSet.tools) && toolSet.tools.some((t) => t.name === toolName);
      if (owns && typeof toolSet.handler === 'function') return toolSet;
    }
    return null;
  }

  _entries() {
    const entries = [];
    for (const [sourceId, toolSet] of this._toolSets) {
      if (!Array.isArray(toolSet.tools)) continue;
      for (const tool of toolSet.tools) entries.push({ sourceId, tool });
    }
    return entries;
  }

  static _extensionSource(extensionId) {
    return `ext.${extensionId}`;
  }

  static _toolNames(toolSet) {
    return Array.isArray(toolSet.tools) ? toolSet.tools.map((t) => t.name) : [];
  }
}

module.exports = McpAggregator;
