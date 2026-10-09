const path = require('path');
const ExtensionUrls = require('./ExtensionUrls');

class DashboardContribution {
  static ROOT_PREFIX = 'ext:';
  static ID_PATTERN = /^[a-z0-9-]+$/;
  static DEFAULT_W = 4;
  static DEFAULT_H = 4;
  static MIN_SIZE = 1;
  static MAX_W = 12;
  static MAX_H = 99;

  static block(manifest) {
    const block = manifest && manifest.dashboard;
    return block && typeof block === 'object' ? block : {};
  }

  static widgets(manifest) {
    const list = DashboardContribution.block(manifest).widgets;
    if (!Array.isArray(list)) return [];
    return list.filter(DashboardContribution._isValidWidget).map((w) => ({
      id: w.id,
      title: String(w.title || w.id),
      file: w.file,
      w: DashboardContribution._size(w.w, DashboardContribution.DEFAULT_W, DashboardContribution.MAX_W),
      h: DashboardContribution._size(w.h, DashboardContribution.DEFAULT_H, DashboardContribution.MAX_H),
      context: typeof w.context === 'string' && w.context.trim() ? w.context.trim() : null,
    }));
  }

  static contextMethod(manifest, widgetId) {
    const widget = DashboardContribution.widgets(manifest).find((w) => w.id === widgetId);
    return widget ? widget.context : null;
  }

  static apiMethods(manifest) {
    const list = DashboardContribution.block(manifest).api;
    if (!Array.isArray(list)) return [];
    return list.filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim());
  }

  static allowsMethod(manifest, method) {
    return typeof method === 'string' && DashboardContribution.apiMethods(manifest).includes(method);
  }

  static assets(manifest) {
    const list = DashboardContribution.block(manifest).assets;
    return Array.isArray(list) ? list.filter((a) => typeof a === 'string' && a) : [];
  }

  static publishedFiles(manifest) {
    const dir = manifest && manifest._dir;
    if (!dir) return [];
    const files = [...DashboardContribution.widgets(manifest).map((w) => w.file), ...DashboardContribution.assets(manifest)];
    return files.map((file) => path.resolve(dir, file));
  }

  static rootId(extensionId, widgetId) {
    return `${DashboardContribution.ROOT_PREFIX}${extensionId}:${widgetId}`;
  }

  static parseRootId(rootId) {
    const text = String(rootId || '');
    if (!text.startsWith(DashboardContribution.ROOT_PREFIX)) return null;
    const parts = text.slice(DashboardContribution.ROOT_PREFIX.length).split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    return { extensionId: parts[0], widgetId: parts[1] };
  }

  static isExtensionRootId(rootId) {
    return DashboardContribution.parseRootId(rootId) !== null;
  }

  static widgetUrl(extensionId, file) {
    return ExtensionUrls.uiFile(extensionId, file);
  }

  static _isValidWidget(w) {
    return !!w && typeof w === 'object'
      && typeof w.id === 'string' && DashboardContribution.ID_PATTERN.test(w.id)
      && typeof w.file === 'string' && !!w.file.trim();
  }

  static _size(value, fallback, max) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(DashboardContribution.MIN_SIZE, n));
  }
}

module.exports = DashboardContribution;
