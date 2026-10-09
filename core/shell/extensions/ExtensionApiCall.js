const IpcEnvelope = require('../../shared/ipc/IpcEnvelope');
const DashboardContribution = require('./DashboardContribution');

class ExtensionApiCall {
  static MAX_ARGS = 8;
  static ID_PATTERN = /^[a-z0-9-]+$/;

  static async invoke(extensionManager, extensionId, method, args) {
    return ExtensionApiCall._run(extensionManager, extensionId, method, args, DashboardContribution.allowsMethod);
  }

  static async invokeWidgetContext(extensionManager, extensionId, widgetId, args) {
    const ext = ExtensionApiCall._extension(extensionManager, extensionId);
    if (!ext) {
      const validId = ExtensionApiCall.ID_PATTERN.test(String(extensionId || ''));
      return { success: false, error: validId ? `extension "${extensionId}" is not active` : 'extensionId required' };
    }
    const method = DashboardContribution.contextMethod(ext.manifest, widgetId);
    if (!method) return { success: false, error: `"${extensionId}" widget "${widgetId}" shares no context` };
    const allowed = (manifest, m) => DashboardContribution.contextMethod(manifest, widgetId) === m;
    return ExtensionApiCall._run(extensionManager, extensionId, method, args, allowed);
  }

  static async _run(extensionManager, extensionId, method, args, allowed) {
    const target = ExtensionApiCall._target(extensionManager, extensionId, method, args, allowed);
    if (target.error) return { success: false, error: target.error };
    try {
      const result = await target.fn.apply(target.api, target.args);
      if (!IpcEnvelope.isCloneable(result)) return { success: false, error: `"${method}" returned a value that cannot cross IPC` };
      return { success: true, result: result === undefined ? null : result };
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err) };
    }
  }

  static _target(extensionManager, extensionId, method, args, allowed) {
    const id = String(extensionId || '');
    if (!ExtensionApiCall.ID_PATTERN.test(id)) return { error: 'extensionId required' };
    if (typeof method !== 'string' || !method) return { error: 'method required' };
    if (args !== undefined && !Array.isArray(args)) return { error: 'args must be an array' };
    const list = args || [];
    if (list.length > ExtensionApiCall.MAX_ARGS) return { error: `at most ${ExtensionApiCall.MAX_ARGS} arguments` };
    const ext = ExtensionApiCall._extension(extensionManager, id);
    if (!ext) return { error: `extension "${id}" is not active` };
    if (!allowed(ext.manifest, method)) return { error: `"${id}" does not publish "${method}"` };
    const fn = ext.api && ext.api[method];
    if (typeof fn !== 'function') return { error: `"${id}" has no "${method}" method` };
    return { fn, api: ext.api, args: list };
  }

  static _extension(extensionManager, id) {
    if (!ExtensionApiCall.ID_PATTERN.test(String(id || ''))) return null;
    const manager = extensionManager && typeof extensionManager.getExtension === 'function' ? extensionManager : null;
    return (manager && manager.getExtension(String(id))) || null;
  }
}

module.exports = ExtensionApiCall;
