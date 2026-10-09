import SetupHooks from './SetupHooks.js';
import SetupProgressEvents from './SetupProgressEvents.js';

export default class RuntimeEnsurer {
  static MLX_MISSING = 'MLX runtime not found. Install it with: pip install mlx-lm, then make sure mlx_lm.server is on your PATH and try again.';

  static async ensure(api, runtimeId, hooks, isMlx) {
    hooks.phase('Checking inference runtime…');
    hooks.setBar(null);
    if (await RuntimeEnsurer._installed(api, runtimeId)) return { ok: true };
    if (isMlx) return { ok: false, message: RuntimeEnsurer.MLX_MISSING };
    return RuntimeEnsurer._install(api, runtimeId, hooks);
  }

  static async _installed(api, runtimeId) {
    const rv = await api.getRuntimesView();
    const row = rv && rv.success && rv.view && (rv.view.runtimes || []).find((x) => x.id === runtimeId);
    return !!(row && row.installed);
  }

  static async _install(api, runtimeId, hooks) {
    hooks.phase('Installing llama.cpp runtime…');
    const result = await SetupHooks.during((cb) => api.onRuntimeEvent(cb), SetupProgressEvents.runtimeListener(hooks),
      () => api.installRuntime(runtimeId));
    if (!result || !result.success) {
      return { ok: false, message: 'Runtime install failed' + (result && result.error ? ': ' + result.error : '') };
    }
    return { ok: true };
  }
}
