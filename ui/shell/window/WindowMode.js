export default class WindowMode {
  static QUERY_KEY = 'window';

  static DETACHED = 'detached';

  static BODY_CLASS = 'detached-window';

  static isDetached(search = WindowMode._search()) {
    try {
      return new URLSearchParams(search || '').get(WindowMode.QUERY_KEY) === WindowMode.DETACHED;
    } catch (_) {
      return false;
    }
  }

  static apply(body = document.body, detached = WindowMode.isDetached()) {
    if (body) body.classList.toggle(WindowMode.BODY_CLASS, detached);
    return detached;
  }

  static _search() {
    return typeof window !== 'undefined' && window.location ? window.location.search : '';
  }
}
