class ToolConcurrency {
  static PARALLEL = 'parallel';
  static EXCLUSIVE = 'exclusive';

  static PARALLEL_SAFE_TOOLS = new Set([
    'read_file',
    'grep',
    'find',
    'list_dir',
    'project_overview',
    'search_knowledge_base',
    'get_tabs',
    'get_artifact_data',
  ]);

  static DEFAULT_MAX_PARALLEL_TOOL_CALLS = 1;
  static NATIVE_MAX_PARALLEL_TOOL_CALLS = 1;
  static MAX_PARALLEL_TOOL_CALLS_CEILING = 8;

  static executionMode(toolName, params) {
    const name = String(toolName || '');
    if (name === 'web_search') return params && params.url ? ToolConcurrency.PARALLEL : ToolConcurrency.EXCLUSIVE;
    return ToolConcurrency.PARALLEL_SAFE_TOOLS.has(name) ? ToolConcurrency.PARALLEL : ToolConcurrency.EXCLUSIVE;
  }

  static resolveMaxParallel(requested, fallback = ToolConcurrency.DEFAULT_MAX_PARALLEL_TOOL_CALLS) {
    const count = Number(requested);
    if (!Number.isFinite(count) || count < 1) return fallback;
    return Math.min(ToolConcurrency.MAX_PARALLEL_TOOL_CALLS_CEILING, Math.floor(count));
  }
}

module.exports = ToolConcurrency;
