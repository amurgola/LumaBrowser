const BrowserTools = require('../../../../llm-service/BrowserTools');
const McpResultUnwrapper = require('./McpResultUnwrapper');

class ToolDispatch {
  constructor({ table, toolSet, ctx }) {
    this._table = table;
    this._toolSet = toolSet;
    this._ctx = ctx;
  }

  async dispatch(name, params, browserService) {
    const handler = this._table.handlerFor(name);
    if (handler) return handler.execute(name, params, this._ctx);
    if (this._toolSet.injected.handlers.has(name)) return this._runInjected(name, params);
    if (this._toolSet.extToolNames.has(name) && this._toolSet.mcpAggregator) return this._runExtension(name, params);
    return BrowserTools.executeTool(name, params, browserService);
  }

  async _runInjected(name, params) {
    const ctx = this._ctx;
    try {
      const res = await this._toolSet.injected.handlers.get(name)(params || {}, {
        conversationId: ctx.conversationId,
        assistantMessageId: ctx.assistantMessageId,
        deps: ctx.deps,
        emit: this._emitter(),
        isAborted: ctx.isAborted,
        artifacts: ctx.artifacts,
        onArtifact: ctx.hooks.onArtifact,
      });
      return res || { success: true };
    } catch (err) {
      return { success: false, error: `${name} failed: ${err.message}` };
    }
  }

  async _runExtension(name, params) {
    const ctx = this._ctx;
    try {
      const res = await this._toolSet.mcpAggregator.handleToolCall(name, params || {}, {
        ignoreDisabled: true,
        emit: this._emitter(),
        chat: {
          conversationId: ctx.conversationId,
          assistantMessageId: ctx.assistantMessageId,
          onArtifact: (a) => this._adoptArtifact(a),
        },
      });
      return McpResultUnwrapper.unwrap(res);
    } catch (err) {
      return { success: false, error: `${name} failed: ${err.message}` };
    }
  }

  _emitter() {
    const ctx = this._ctx;
    return (payload) => {
      if (ctx.isAborted()) return;
      if (ctx.hooks.onAgentEvent) { try { ctx.hooks.onAgentEvent(payload); } catch (_) {} }
    };
  }

  _adoptArtifact(artifact) {
    const ctx = this._ctx;
    if (ctx.isAborted() || !artifact || !artifact.id) return;
    ctx.artifacts.push(artifact);
    if (ctx.hooks.onArtifact) { try { ctx.hooks.onArtifact(artifact); } catch (_) {} }
  }
}

module.exports = ToolDispatch;
