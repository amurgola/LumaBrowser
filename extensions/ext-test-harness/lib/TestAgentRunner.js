const BrowserTools = require('../../../core/llm-service/BrowserTools');
const TestAgentPrompt = require('./TestAgentPrompt');
const TestTabs = require('./TestTabs');
const TestToolExecutor = require('./TestToolExecutor');

class TestAgentRunner {
  static DEFAULT_MAX_ITERATIONS = 15;
  static DEFAULT_SLOT_ID = 'ai-chat.navigator';
  static COMPLETION_OPTIONS = { temperature: 0.2, timeout: 120000 };
  static RETRY_DELAY_MS = 5000;
  static NOT_READY_MARKERS = ['500', 'econnrefused', 'failed', 'not configured'];

  constructor(llmService, services, options = {}) {
    this.llm = llmService;
    this.browserService = services.browserService;
    this.maxIterations = options.maxIterations || TestAgentRunner.DEFAULT_MAX_ITERATIONS;
    this.slotId = options.slotId || TestAgentRunner.DEFAULT_SLOT_ID;
    this.onProgress = options.onProgress || null;
    this._wait = options.wait || ((ms) => new Promise((r) => setTimeout(r, ms)));
    this._tabs = new TestTabs(this.browserService);
    this._tools = new TestToolExecutor({ browserService: this.browserService });
  }

  async run(userPrompt) {
    const startTime = Date.now();
    const state = { messages: [], toolCalls: [] };
    state.messages.push({ role: 'system', content: TestAgentPrompt.build(await this._prepareTab()) });
    state.messages.push({ role: 'user', content: userPrompt });
    const outcome = await this._loop(state);
    return {
      ...outcome,
      conversationHistory: state.messages,
      toolCalls: state.toolCalls,
      durationMs: Date.now() - startTime,
    };
  }

  async _prepareTab() {
    let tabInfo = await this._tabs.describeActive();
    if (await this._tabs.hasValidTab()) return tabInfo;
    try {
      const result = await this.browserService.createTab('about:blank');
      if (result.tab && result.tab.id != null) tabInfo = `Tab ${result.tab.id}: about:blank (new tab)`;
    } catch (_) {}
    return tabInfo;
  }

  async _loop(state) {
    let iterations = 0;
    for (let i = 0; i < this.maxIterations; i++) {
      iterations = i + 1;
      this._emitProgress(i, null, 'thinking');
      if (i >= this.maxIterations - 2) state.messages.push({ role: 'user', content: this._lowStepWarning(i) });
      const result = await this._complete(state.messages, i);
      if (!result.success) return { finalResponse: '', iterations, error: result.error || 'LLM completion failed' };
      const content = TestAgentRunner._contentOf(result.response);
      state.messages.push({ role: 'assistant', content });
      const toolCall = BrowserTools.parseToolCall(content);
      if (!toolCall) return { finalResponse: content, iterations, error: null };
      TestAgentRunner._feedBack(state, toolCall.tool, await this._executeTracked(state, toolCall, i));
    }
    return { finalResponse: '', iterations, error: null };
  }

  _lowStepWarning(i) {
    return `[System: You have ${this.maxIterations - i} step(s) remaining. You MUST provide your final answer NOW with no tool calls. Summarize what you found.]`;
  }

  async _complete(messages, i) {
    const result = await this.llm.sendCompletion(this.slotId, messages, TestAgentRunner.COMPLETION_OPTIONS);
    if (result.success || i !== 0 || !TestAgentRunner._looksNotReady(result.error)) return result;
    await this._wait(TestAgentRunner.RETRY_DELAY_MS);
    return this.llm.sendCompletion(this.slotId, messages, TestAgentRunner.COMPLETION_OPTIONS);
  }

  async _executeTracked(state, toolCall, i) {
    this._emitProgress(i, toolCall.tool, 'executing');
    const toolStart = Date.now();
    const toolResult = await this._tools.execute(toolCall.tool, toolCall.params);
    state.toolCalls.push({
      iteration: i,
      tool: toolCall.tool,
      params: toolCall.params,
      result: toolResult,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - toolStart,
    });
    this._emitProgress(i, toolCall.tool, toolResult.success !== false ? 'success' : 'error');
    return toolResult;
  }

  static _feedBack(state, tool, result) {
    state.messages.push({ role: 'user', content: `[Tool Result for ${tool}]: ${result ? JSON.stringify(result) : 'null'}` });
  }

  static _contentOf(response) {
    const choice = response && response.choices && response.choices[0];
    return (choice && choice.message && choice.message.content) || '';
  }

  static _looksNotReady(error) {
    const text = (error || '').toLowerCase();
    return TestAgentRunner.NOT_READY_MARKERS.some((marker) => text.includes(marker));
  }

  _emitProgress(iteration, tool, status) {
    if (!this.onProgress) return;
    try { this.onProgress({ iteration, tool, status }); } catch (_) {}
  }
}

module.exports = TestAgentRunner;
