export default class GameLanguageModel {
  static META_KEY = 'llmModel';

  static LOCAL_PREFIX = 'local::';

  static CURRENT = { value: '', label: 'Use current chat model' };

  static async choices(api) {
    const locals = await GameLanguageModel._locals(api);
    const remote = await GameLanguageModel._remote(api);
    const options = [GameLanguageModel.CURRENT]
      .concat(locals.map((m) => ({ value: m.ref, label: 'Local · ' + (m.displayName || m.name || m.ref) })))
      .concat(remote.map((m) => ({ value: m.ref, label: m.label || m.ref })));
    return { options, locals };
  }

  static async apply(api, ref, locals) {
    const local = GameLanguageModel._isLocal(ref) ? (locals || []).find((m) => m && m.ref === ref) : null;
    if (!local || !local.path || !api || typeof api.setDefaults !== 'function') return;
    try { await api.setDefaults({ modelPath: local.path }); } catch (_) {}
  }

  static async record(ref, ctx) {
    if (!ref || typeof ref !== 'string' || !ctx || !ctx.conversationId || typeof ctx.setMeta !== 'function') return null;
    const stored = await GameLanguageModel._storedData(ctx);
    return ctx.setMeta({ data: { ...stored, [GameLanguageModel.META_KEY]: ref } });
  }

  static _isLocal(ref) {
    return typeof ref === 'string' && ref.indexOf(GameLanguageModel.LOCAL_PREFIX) === 0;
  }

  static async _locals(api) {
    try {
      const r = api && api.getLocalModelOptions ? await api.getLocalModelOptions() : null;
      return r && r.success && Array.isArray(r.models) ? r.models : [];
    } catch (_) {
      return [];
    }
  }

  static async _remote(api) {
    try {
      const r = api && api.listModels ? await api.listModels() : null;
      const rows = r && r.success && Array.isArray(r.models) ? r.models : [];
      return rows.filter((m) => m && m.ref && !m.isLocal && !m.isProfile && m.role !== 'helper');
    } catch (_) {
      return [];
    }
  }

  static async _storedData(ctx) {
    try {
      const r = await ctx.api.conv.meta.get(ctx.conversationId);
      return (r && r.success && r.meta && r.meta.data) || {};
    } catch (_) {
      return {};
    }
  }
}
