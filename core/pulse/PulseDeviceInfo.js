const os = require('os');

class PulseDeviceInfo {
  static FIELD_MAX_LENGTH = 64;
  static UNSAFE_CHARACTERS = /[^\w.\-+ ]/g;

  static appVersion() {
    try {
      return require('electron').app.getVersion() || '';
    } catch (_) {
      return '';
    }
  }

  static platform() {
    return process.platform || os.platform() || 'unknown';
  }

  static userAgent(facts = PulseDeviceInfo._currentFacts()) {
    const clean = PulseDeviceInfo._sanitize;
    return `LumaBrowser/${clean(facts.appVersion)} (${clean(facts.platform)} ${clean(facts.arch)}; `
      + `${clean(facts.osType)} ${clean(facts.osRelease)}) Electron/${clean(facts.electronVersion)}`;
  }

  static _currentFacts() {
    return {
      appVersion: PulseDeviceInfo.appVersion(),
      platform: process.platform,
      arch: process.arch,
      osType: os.type(),
      osRelease: os.release(),
      electronVersion: process.versions && process.versions.electron,
    };
  }

  static _sanitize(value) {
    return String(value || '').replace(PulseDeviceInfo.UNSAFE_CHARACTERS, '').slice(0, PulseDeviceInfo.FIELD_MAX_LENGTH);
  }
}

module.exports = PulseDeviceInfo;
