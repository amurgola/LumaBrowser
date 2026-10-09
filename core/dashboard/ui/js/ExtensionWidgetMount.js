import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';
import ExtensionWidgetHost from './ExtensionWidgetHost.js';

export default class ExtensionWidgetMount {
  static NO_MOUNT = 'This widget\'s module has no default export with a mount(root, host) function.';

  static importer = (url) => import(url);

  static async mount(root, meta, api) {
    if (!root || root.dataset.mounted === '1') return { dispose: () => {} };
    root.dataset.mounted = '1';
    try {
      return await ExtensionWidgetMount._mountInto(root, meta, api);
    } catch (e) {
      ExtensionWidgetMount._showError(root, e);
      return { dispose: () => {} };
    }
  }

  static async _mountInto(root, meta, api) {
    const mod = await ExtensionWidgetMount.importer(meta.url);
    const widget = mod && mod.default;
    if (!widget || typeof widget.mount !== 'function') throw new Error(ExtensionWidgetMount.NO_MOUNT);
    const host = ExtensionWidgetHost.create(api, meta.extensionId);
    const teardown = await widget.mount(root, host);
    return { dispose: () => ExtensionWidgetMount._dispose(teardown) };
  }

  static _dispose(teardown) {
    if (typeof teardown !== 'function') return;
    try {
      const out = teardown();
      if (out && typeof out.catch === 'function') out.catch(() => {});
    } catch (_) {}
  }

  static _showError(root, err) {
    root.insertAdjacentHTML('beforeend',
      '<pre class="cm-live-err">' + HtmlEscaper.escapeText(String((err && err.message) || err)) + '</pre>');
  }
}
