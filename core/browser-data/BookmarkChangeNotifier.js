class BookmarkChangeNotifier {
  static CHANNEL = 'bookmarks:changed';

  constructor(getMainWindow) {
    this._getMainWindow = getMainWindow;
  }

  notify() {
    const win = this._liveWindow();
    if (win) win.webContents.send(BookmarkChangeNotifier.CHANNEL);
  }

  afterMutation(mutation) {
    const result = mutation();
    this.notify();
    return result;
  }

  _liveWindow() {
    const win = typeof this._getMainWindow === 'function' ? this._getMainWindow() : null;
    return win && !win.isDestroyed() ? win : null;
  }
}

module.exports = BookmarkChangeNotifier;
