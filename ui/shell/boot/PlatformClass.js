export default class PlatformClass {
  static detect(platform) {
    const value = String(platform || '').toLowerCase();
    if (value.includes('mac')) return 'darwin';
    if (value.includes('linux')) return 'linux';
    if (value.includes('win')) return 'win32';
    return 'other';
  }

  static apply(body = document.body, platform = navigator.platform) {
    body.classList.add(`platform-${PlatformClass.detect(platform)}`);
  }
}
