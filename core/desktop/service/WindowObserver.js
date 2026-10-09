const path = require('path');

class WindowObserver {
  static DEFAULT_MAX_NODES = 150;
  static CHROMIUM_RETRY_MS = 700;
  static CHROMIUM_EXES = /^(chrome|msedge|brave|opera|vivaldi|electron|code|slack|discord|teams|ms-teams|spotify|obsidian|notion|figma|whatsapp|signal)\.exe$/i;
  static NAME_CHARS = 80;

  constructor({ win, sleep }) {
    this._win = win;
    this._sleep = sleep;
  }

  async read(uia, w, maxNodes = WindowObserver.DEFAULT_MAX_NODES) {
    const chromium = this.isChromium(w);
    if (chromium && typeof uia.wake === 'function') await uia.wake(w.hwnd).catch(() => null);
    const first = await uia.tree(w.hwnd, { maxNodes });
    if (!chromium || !WindowObserver._looksUnbuilt(first.nodes)) return first;
    await this._sleep(WindowObserver.CHROMIUM_RETRY_MS);
    return uia.tree(w.hwnd, { maxNodes });
  }

  isChromium(w) {
    if (/^Chrome_WidgetWin_/.test(w.className || '')) return true;
    let exe = null;
    try { exe = this._win.processImagePath(w.pid); } catch (_) { exe = null; }
    return !!(exe && WindowObserver.CHROMIUM_EXES.test(path.basename(String(exe).replace(/\\/g, '/'))));
  }

  static describe(w, nodes, truncated) {
    const lines = nodes.map((n) => `  [${n.ref}] ${n.role} "${String(n.name || '').slice(0, WindowObserver.NAME_CHARS)}"${n.enabled === false ? ' (disabled)' : ''}`);
    return [
      `WINDOW: ${w.title} (hwnd ${w.hwnd})`,
      nodes.length
        ? `ELEMENTS (${nodes.length}${truncated ? '+, truncated' : ''}):`
        : 'No accessible elements: this app draws its own UI (game, canvas, custom toolkit). Use desktop_screenshot and desktop_click with a description or x/y.',
      ...lines,
    ].join('\n');
  }

  static _looksUnbuilt(nodes) {
    const lastIsDocument = nodes.length && nodes[nodes.length - 1].role === 'Document';
    return nodes.length < 3 || !!lastIsDocument;
  }
}

module.exports = WindowObserver;
