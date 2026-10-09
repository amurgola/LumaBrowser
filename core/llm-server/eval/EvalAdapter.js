const AgentRunner = require('../agent/AgentRunner');

class EvalAdapter {
  static BRIDGE_ONLY_TOOLS = new Set(['create_artifact', 'edit_artifact', 'generate_image', 'edit_image', 'validate_code']);

  static DEFAULT_MAX_ITERATIONS = 12;
  static DEFAULT_TIMEOUT_MS = 240000;

  static supportsTask(task) {
    const specs = (task && task.expect && task.expect.toolCalls) || [];
    return !specs.some((s) => s.tool && EvalAdapter.BRIDGE_ONLY_TOOLS.has(s.tool));
  }

  static makeAgentRun({ llmService, deps, Runner = AgentRunner }) {
    const agent = new Runner(llmService, { browserService: deps.browserService }, deps.db);
    return async ({ task, variant }) => EvalAdapter._runTask(agent, task, variant);
  }

  static makeBridgeAgentRun({ bridge, deps }) {
    if (!bridge || typeof bridge.runForEval !== 'function') {
      throw new Error('makeBridgeAgentRun: a bridge with runForEval() is required');
    }
    return async ({ task, variant, modelRef }) => bridge.runForEval({ task, variant, deps, modelRef });
  }

  static async _runTask(agent, task, variant) {
    if (!EvalAdapter.supportsTask(task)) {
      throw new Error(`task "${task.id}" needs the bridge adapter (pseudo-tool); skipping in AgentRunner-only mode`);
    }
    const result = await agent.run({
      prompt: task.prompt,
      tools: Array.isArray(task.allowedTools) ? task.allowedTools : undefined,
      systemPromptAppend: EvalAdapter.promptAppend(task, variant),
      systemPromptOverride: EvalAdapter.promptOverride(variant),
      maxIterations: task.maxIterations || EvalAdapter.DEFAULT_MAX_ITERATIONS,
      timeout: task.timeout || EvalAdapter.DEFAULT_TIMEOUT_MS,
      autoCloseTab: true,
      lazyTab: true,
    });
    const { finalResponse, iterations, durationMs, toolCalls, error } = result;
    return { finalResponse, iterations, durationMs, toolCalls, error };
  }

  static promptAppend(task, variant) {
    if (typeof variant.buildAppend === 'function') return variant.buildAppend(task);
    return variant.systemPromptAppend || '';
  }

  static promptOverride(variant) {
    if (typeof variant.buildPrompt === 'function') return variant.buildPrompt;
    return variant.systemPrompt != null ? variant.systemPrompt : undefined;
  }
}

module.exports = EvalAdapter;
