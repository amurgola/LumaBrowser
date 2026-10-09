export default class ServiceWorkerRegistrar {
  static SCRIPT = 'sw.js';

  static register(win) {
    const nav = win.navigator;
    if (!nav || !('serviceWorker' in nav)) return false;
    win.addEventListener('load', () => {
      nav.serviceWorker.register(ServiceWorkerRegistrar.SCRIPT).catch(() => {});
    });
    return true;
  }
}
