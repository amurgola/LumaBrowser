export default class ExtensionWidgetHost {
  static create(api, extensionId) {
    return {
      extensionId,
      call: (method, ...args) => ExtensionWidgetHost._call(api, extensionId, method, args),
      onEvent: (cb) => ExtensionWidgetHost._onEvent(api, extensionId, cb),
      openTab: (url) => ExtensionWidgetHost._openTab(api, url),
      openChat: () => ExtensionWidgetHost._openChat(api),
    };
  }

  static async _call(api, extensionId, method, args) {
    const r = await api.ext.call(extensionId, method, args);
    if (!r || r.success === false) throw new Error((r && r.error) || 'extension call failed');
    return r.result;
  }

  static _onEvent(api, extensionId, cb) {
    if (typeof cb !== 'function' || !api.ext || typeof api.ext.onEvent !== 'function') return () => {};
    return api.ext.onEvent(extensionId, (event) => cb(event));
  }

  static async _openTab(api, url) {
    const r = await api.liveApi.openTab({ url });
    if (!r || r.success === false) throw new Error((r && r.error) || 'openTab failed');
    return true;
  }

  static async _openChat(api) {
    const r = await api.openChat(null);
    return !!(r && r.success);
  }
}
