const ToolDispatch = require('./ToolDispatch');

class DetachedToolCalls {
  static BUILTIN = 'builtin';
  static SESSION = 'session';
  static EXTENSION = 'extension';
  static HOOKS = ['onToolEvent', 'onStatus', 'onArtifact', 'onArtifactStream', 'onAgentEvent'];

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

  run(name, params, task) {
    return this._dispatch(name, params, this._taskContext(task));
  }

  begin(name, params) {
    const owner = { ctx: this._ctx };
    const pending = this._dispatch(name, params, DetachedToolCalls._followingContext(this._ctx, owner));
    return { pending, handTo: (task) => { owner.ctx = this._taskContext(task); } };
  }

  async _dispatch(name, params, ctx) {
    const dispatch = new ToolDispatch({ table: this._table, toolSet: this._toolSet, ctx });
    try {
      return await dispatch.dispatch(name, params, this._ctx.deps && this._ctx.deps.browserService);
    } catch (err) {
      return { success: false, error: `${name} failed: ${(err && err.message) || err}` };
    }
  }

  static _followingContext(base, owner) {
    const forward = (hook) => (...args) => {
      const target = owner.ctx.hooks && owner.ctx.hooks[hook];
      return typeof target === 'function' ? target(...args) : undefined;
    };
    const ctx = {
      ...base,
      hooks: Object.fromEntries(DetachedToolCalls.HOOKS.map((hook) => [hook, forward(hook)])),
      isAborted: () => !!owner.ctx.isAborted(),
      detached: null,
    };
    Object.defineProperty(ctx, 'artifacts', { enumerable: true, get: () => owner.ctx.artifacts });
    return ctx;
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
