export default class HostPlatform {
  static isMacPlatform(nav) {
    const n = nav || navigator;
    return /mac/i.test(n.platform || '');
  }

  static isMac(nav) {
    const n = nav || navigator;
    return HostPlatform.isMacPlatform(n) || /Mac OS X/i.test(n.userAgent || '');
  }
}
