export default class WindowMode {
  static QUERY_KEY = 'window';

  static DETACHED = 'detached';

  static BODY_CLASS = 'detached-window';

  static PRIVATE_CLASS = 'private-window';

  static isPrivate(search = WindowMode._search()) {
    try {
      return new URLSearchParams(search || '').get('private') === '1';
    } catch (_) {
      return false;
    }
  }

  static isDetached(search = WindowMode._search()) {
    try {
      return new URLSearchParams(search || '').get(WindowMode.QUERY_KEY) === WindowMode.DETACHED;
    } catch (_) {
      return false;
    }
  }

  static apply(body = document.body, detached = WindowMode.isDetached(), priv = WindowMode.isPrivate()) {
    if (body) {
      body.classList.toggle(WindowMode.BODY_CLASS, detached);
      body.classList.toggle(WindowMode.PRIVATE_CLASS, priv);
    }
    const badge = typeof document !== 'undefined' ? document.getElementById('privateBadge') : null;
    if (badge) badge.hidden = !priv;
    return detached;
  }

  static _search() {
    return typeof window !== 'undefined' && window.location ? window.location.search : '';
  }
}
