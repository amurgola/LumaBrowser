const DashboardContribution = require('../shell/extensions/DashboardContribution');

class ExtensionWidgetCatalog {
  constructor(getExtensionManager) {
    this._getManager = typeof getExtensionManager === 'function' ? getExtensionManager : () => null;
  }

  list() {
    const manager = this._getManager();
    if (!manager || !manager.extensions || typeof manager.extensions.values !== 'function') return [];
    const out = [];
    for (const [extensionId, ext] of manager.extensions) {
      const manifest = ext && ext.manifest;
      if (!manifest) continue;
      for (const widget of DashboardContribution.widgets(manifest)) {
        const url = DashboardContribution.widgetUrl(extensionId, widget.file);
        if (url) out.push(ExtensionWidgetCatalog._entry(extensionId, widget, url));
      }
    }
    return out;
  }

  static _entry(extensionId, widget, url) {
    return {
      rootId: DashboardContribution.rootId(extensionId, widget.id),
      extensionId,
      widgetId: widget.id,
      title: widget.title,
      url,
      w: widget.w,
      h: widget.h,
      context: widget.context,
    };
  }
}

module.exports = ExtensionWidgetCatalog;
