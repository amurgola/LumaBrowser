export default class RendererGlobal {
  static key(extensionId) {
    return `__ext_${extensionId.replace(/-/g, '_')}`;
  }

  static get(extensionId) {
    return window[RendererGlobal.key(extensionId)];
  }

  static purge(extensionId) {
    const key = RendererGlobal.key(extensionId);
    try { delete window[key]; } catch (_) { window[key] = undefined; }
    for (const el of document.querySelectorAll('script[data-ext]')) {
      if (el.dataset.ext === extensionId) el.remove();
    }
  }
}
