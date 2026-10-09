class DesktopNotice {
  constructor({ Notification, iconPath }) {
    this._Notification = Notification;
    this._iconPath = iconPath;
  }

  show({ title, body, onClick = null }) {
    try {
      if (!this._isSupported()) return false;
      const notice = new this._Notification({ title, body, icon: this._iconPath });
      if (typeof onClick === 'function') notice.on('click', onClick);
      notice.show();
      return true;
    } catch (_) {
      return false;
    }
  }

  _isSupported() {
    const N = this._Notification;
    return Boolean(N && typeof N.isSupported === 'function' && N.isSupported());
  }
}

module.exports = DesktopNotice;
