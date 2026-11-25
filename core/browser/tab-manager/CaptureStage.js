class CaptureStage {
  static WAIT_MS = 2000;
  static POLL_MS = 50;
  static UNSIZED = { width: 1280, height: 800 };
  static TITLE = 'Luma capture';

  constructor({ BrowserWindow = null, waitMs = CaptureStage.WAIT_MS, pollMs = CaptureStage.POLL_MS } = {}) {
    this._BrowserWindow = BrowserWindow;
    this._waitMs = waitMs;
    this._pollMs = pollMs;
  }

  isOnScreen(view) {
    const window = this._windowOf(view);
    return !!window && window.isVisible() && !window.isMinimized() && view.getVisible();
  }

  async lend(view, work) {
    const home = this._homeOf(view);
    const size = CaptureStage._sizeFor(home.bounds);
    const stage = this._open(size);
    try {
      CaptureStage._moveOn(view, stage, size);
      return await work();
    } finally {
      CaptureStage._sendHome(view, home, stage);
      stage.destroy();
    }
  }

  async capture(webContents, clip) {
    const deadline = Date.now() + this._waitMs;
    for (;;) {
      const image = await CaptureStage._answerBy(deadline, webContents.capturePage(clip, { stayHidden: true }));
      if (image && !image.isEmpty()) return image;
      if (Date.now() >= deadline) return null;
      await new Promise((resolve) => setTimeout(resolve, this._pollMs));
    }
  }

  static _answerBy(deadline, capture) {
    let timer = null;
    const gaveUp = new Promise((resolve) => { timer = setTimeout(() => resolve(null), Math.max(0, deadline - Date.now())); });
    return Promise.race([capture, gaveUp]).finally(() => clearTimeout(timer));
  }

  _homeOf(view) {
    const window = this._windowOf(view);
    return {
      window,
      index: window ? window.contentView.children.indexOf(view) : -1,
      bounds: view.getBounds(),
      visible: view.getVisible(),
    };
  }

  _windowOf(view) {
    return this._windowClass().getAllWindows().find((candidate) => CaptureStage._holds(candidate, view)) || null;
  }

  static _holds(window, view) {
    return !window.isDestroyed() && window.contentView.children.includes(view);
  }

  static _sizeFor(bounds) {
    return bounds.width > 0 && bounds.height > 0 ? { width: bounds.width, height: bounds.height } : CaptureStage.UNSIZED;
  }

  _open(size) {
    const BrowserWindow = this._windowClass();
    return new BrowserWindow({
      show: false, title: CaptureStage.TITLE, width: size.width, height: size.height,
      useContentSize: true, enableLargerThanScreen: true,
    });
  }

  static _moveOn(view, stage, size) {
    stage.contentView.addChildView(view);
    view.setBounds({ x: 0, y: 0, width: size.width, height: size.height });
    view.setVisible(true);
  }

  static _sendHome(view, home, stage) {
    if (home.window && !home.window.isDestroyed()) home.window.contentView.addChildView(view, home.index);
    else stage.contentView.removeChildView(view);
    view.setBounds(home.bounds);
    view.setVisible(home.visible);
  }

  _windowClass() {
    if (!this._BrowserWindow) this._BrowserWindow = require('electron').BrowserWindow;
    return this._BrowserWindow;
  }
}

module.exports = CaptureStage;
