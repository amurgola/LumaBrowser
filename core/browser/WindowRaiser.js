class WindowRaiser {
  static raise(win) {
    if (!win || (typeof win.isDestroyed === 'function' && win.isDestroyed())) return false;
    try {
      if (win.isMinimized()) win.restore();
      win.show();
      WindowRaiser._focus(win);
      return true;
    } catch (_) {
      return false;
    }
  }

  static _focus(win) {
    if (process.platform !== 'win32' || typeof win.setAlwaysOnTop !== 'function') {
      win.focus();
      return;
    }
    win.setAlwaysOnTop(true);
    win.focus();
    win.setAlwaysOnTop(false);
  }
}

module.exports = WindowRaiser;
