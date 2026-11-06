class FullscreenEscape {
  static install(win) {
    if (!win || !win.document) return false;
    win.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !win.document.fullscreenElement) return;
      try { win.document.exitFullscreen(); } catch (_) {}
    }, true);
    return true;
  }
}

module.exports = FullscreenEscape;
