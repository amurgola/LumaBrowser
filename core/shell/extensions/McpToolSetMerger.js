class McpToolSetMerger {
  static merge(manual, exposed) {
    if (!manual) return exposed || null;
    if (!exposed) return manual;
    const exposedNames = new Set((exposed.tools || []).map((tool) => tool.name));
    return {
      tools: [...(manual.tools || []), ...(exposed.tools || [])],
      handler: async (toolName, args, opts) => (exposedNames.has(toolName)
        ? exposed.handler(toolName, args, opts)
        : manual.handler(toolName, args, opts)),
    };
  }
}

module.exports = McpToolSetMerger;
