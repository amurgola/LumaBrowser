class ToolProgress {
  static reporter(ctx, tool) {
    const hooks = (ctx && ctx.hooks) || {};
    const isAborted = ctx && typeof ctx.isAborted === 'function' ? ctx.isAborted : () => false;
    return (fields) => {
      if (!fields || typeof hooks.onToolEvent !== 'function' || isAborted()) return;
      try { hooks.onToolEvent({ phase: 'status', tool, ...ToolProgress._fields(fields) }); } catch (_) {}
    };
  }

  static messenger(ctx, tool) {
    const report = ToolProgress.reporter(ctx, tool);
    return (message) => { if (message) report({ message: String(message) }); };
  }

  static _fields(fields) {
    const out = {};
    for (const key of ['step', 'totalSteps', 'elapsedMs']) if (typeof fields[key] === 'number') out[key] = fields[key];
    if (fields.message) out.message = String(fields.message);
    return out;
  }
}

module.exports = ToolProgress;
