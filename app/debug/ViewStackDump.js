const fs = require('fs');
const path = require('path');

class ViewStackDump {
  static FILE_NAME = 'view-stack-dump.json';
  static PROBE_TIMEOUT_MS = 2000;
  static TOP_CHROME_PX = 100;

  static DRAG_PROBE = `(() => {
      const rects = []; let seen = 0;
      for (const el of document.querySelectorAll('*')) {
        if (++seen > 20000 || rects.length >= 20) break;
        if (getComputedStyle(el).webkitAppRegion !== 'drag') continue;
        const r = el.getBoundingClientRect();
        rects.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 60),
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
      }
      return { vw: innerWidth, vh: innerHeight, rects };
    })()`;

  constructor({ win, tabViewManager, chromeOverlay, userDataDir, log = console, fsImpl = fs, now = () => new Date() }) {
    this._win = win;
    this._tvm = tabViewManager;
    this._overlay = chromeOverlay;
    this._userDataDir = userDataDir;
    this._log = log;
    this._fs = fsImpl;
    this._now = now;
  }

  async capture() {
    const suspects = [];
    const views = await this._describeViews(suspects);
    const dump = {
      at: this._now().toISOString(),
      window: this._windowState(),
      activeTabId: this._tvm.activeTabId,
      rendererBounds: this._tvm.currentBounds,
      views,
      shellDragRegions: await ViewStackDump.probeDragRegions(this._win.webContents),
      suspects,
    };
    this._log.log('---- view-stack dump ----');
    this._log.log(JSON.stringify(dump, null, 2));
    return { ...dump, file: this._write(dump) };
  }

  async _describeViews(suspects) {
    const views = [];
    const children = this._win.contentView.children;
    for (let z = 0; z < children.length; z++) {
      const info = { z, ...this.identify(children[z]) };
      ViewStackDump._readGeometry(children[z], info);
      await this._probeView(children[z], info, suspects);
      ViewStackDump.flagCoveringView(info, suspects);
      views.push(info);
    }
    return views;
  }

  identify(view) {
    for (const tab of this._tvm.tabs.values()) {
      if (tab.view === view) {
        return {
          owner: 'tab', tabId: tab.id, kind: tab.kind, silent: tab.silent,
          hidden: Boolean(tab.hidden), keepAlive: Boolean(tab.keepAlive),
          previewing: Boolean(tab.previewing), active: tab.id === this._tvm.activeTabId,
        };
      }
    }
    for (const [layerId, layer] of this._overlay.layers) {
      if (layer.view === view) return { owner: 'overlay', layerId, layerVisible: layer.visible };
    }
    return { owner: 'unknown' };
  }

  async _probeView(view, info, suspects) {
    const wc = view.webContents;
    if (!wc || wc.isDestroyed()) return;
    info.url = (wc.getURL() || '').slice(0, 120);
    info.dragRegions = await ViewStackDump.probeDragRegions(wc);
    ViewStackDump.flagDragRects(info, suspects);
  }

  static flagDragRects(info, suspects) {
    const inert = info.owner !== 'unknown' && !(info.owner === 'tab' && info.active);
    if (!inert) return;
    for (const rect of (info.dragRegions && info.dragRegions.rects) || []) {
      if (!rect.w || !rect.h) continue;
      const windowY = (info.bounds ? info.bounds.y : 0) + rect.y;
      suspects.push(`z${info.z} ${info.owner}${info.hidden ? '/hidden' : ''} declares drag rect ${rect.w}x${rect.h} at page y=${rect.y} (window y~${windowY}): ${info.url}`);
    }
  }

  static flagCoveringView(info, suspects) {
    const covers = info.visible && info.bounds && info.bounds.height > 0 && info.bounds.y < ViewStackDump.TOP_CHROME_PX;
    const expected = (info.owner === 'tab' && info.active) || (info.owner === 'overlay' && info.layerVisible);
    if (covers && !expected) suspects.push(`z${info.z} ${info.owner} is VISIBLE over the top chrome at y=${info.bounds.y}: ${info.url || ''}`);
  }

  static probeDragRegions(webContents) {
    return Promise.race([
      webContents.executeJavaScript(ViewStackDump.DRAG_PROBE, true).catch((e) => ({ error: String(e && e.message).slice(0, 120), rects: [] })),
      new Promise((resolve) => setTimeout(() => resolve({ error: 'timeout', rects: [] }), ViewStackDump.PROBE_TIMEOUT_MS)),
    ]);
  }

  static _readGeometry(view, info) {
    try { info.bounds = view.getBounds(); } catch (_) {}
    try { info.visible = view.getVisible(); } catch (_) {}
  }

  _windowState() {
    const win = this._win;
    return { bounds: win.getBounds(), contentBounds: win.getContentBounds(), maximized: win.isMaximized(), fullScreen: win.isFullScreen() };
  }

  _write(dump) {
    try {
      const file = path.join(this._userDataDir, ViewStackDump.FILE_NAME);
      this._fs.writeFileSync(file, JSON.stringify(dump, null, 2));
      return file;
    } catch (_) {
      return null;
    }
  }
}

module.exports = ViewStackDump;
