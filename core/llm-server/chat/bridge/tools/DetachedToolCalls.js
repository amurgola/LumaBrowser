const ToolDispatch = require('./ToolDispatch');

class DetachedToolCalls {
  static BUILTIN = 'builtin';
  static SESSION = 'session';
  static EXTENSION = 'extension';

  constructor({ pipeline, table, toolSet, ctx }) {
    this._pipeline = pipeline;
    this._table = table;
    this._toolSet = toolSet;
    this._ctx = ctx;
  }

  allows(name) {
    return this._toolSet.allows(name);
  }

  kindOf(name) {
    if (this._table.handlerFor(name)) return DetachedToolCalls.BUILTIN;
    if (this._toolSet.injected.handlers.has(name)) return DetachedToolCalls.SESSION;
    if (this._toolSet.extToolNames.has(name)) return DetachedToolCalls.EXTENSION;
    return null;
  }

  admit(name, params) {
    return this._pipeline.admitDetached(name, params);
  }

  async run(name, params, task) {
    const dispatch = new ToolDispatch({ table: this._table, toolSet: this._toolSet, ctx: this._taskContext(task) });
    try {
      return await dispatch.dispatch(name, params, this._ctx.deps && this._ctx.deps.browserService);
    } catch (err) {
      return { success: false, error: `${name} failed: ${(err && err.message) || err}` };
    }
  }

  _taskContext(task) {
    return {
      ...this._ctx,
      hooks: DetachedToolCalls._taskHooks(task),
      artifacts: task.artifacts,
      isAborted: () => !!task.isStopped(),
      detached: null,
    };
  }

  static _taskHooks(task) {
    const quiet = () => {};
    return {
      onToolEvent: (payload) => {
        if (!payload || payload.phase !== 'status') return;
        task.report({ step: payload.step, totalSteps: payload.totalSteps, ...(payload.message ? { detail: payload.message } : {}) });
      },
      onStatus: quiet,
      onArtifact: quiet,
      onArtifactStream: quiet,
      onAgentEvent: quiet,
    };
  }
}

module.exports = DetachedToolCalls;
