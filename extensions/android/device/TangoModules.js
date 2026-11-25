const AppModules = require('../AppModules');

class TangoModules {
  static _loading = null;

  static load(loadModule = AppModules.load) {
    if (!TangoModules._loading) {
      TangoModules._loading = Promise.resolve().then(() => ({
        adb: loadModule('@yume-chan/adb'),
        nodeTcp: loadModule('@yume-chan/adb-server-node-tcp'),
        adbScrcpy: loadModule('@yume-chan/adb-scrcpy'),
        scrcpy: loadModule('@yume-chan/scrcpy'),
        streams: loadModule('@yume-chan/stream-extra'),
      }));
    }
    return TangoModules._loading;
  }
}

module.exports = TangoModules;
