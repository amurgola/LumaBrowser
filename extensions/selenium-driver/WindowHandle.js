class WindowHandle {
  static PREFIX = 'luma-tab-';

  static fromTabId(tabId) {
    return `${WindowHandle.PREFIX}${tabId}`;
  }

  static toTabId(handle) {
    const match = /^luma-tab-(.+)$/.exec(handle || '');
    if (!match) return null;
    const n = Number(match[1]);
    return Number.isNaN(n) ? match[1] : n;
  }
}

module.exports = WindowHandle;
