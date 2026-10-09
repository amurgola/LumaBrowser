const fs = require('fs');
const path = require('path');
const RoleplayEnv = require('./RoleplayEnv');

class RpDebug {
  static PREFIX = '[rp-debug] ';

  static log(event, info) {
    if (!RoleplayEnv.debug()) return;
    try {
      console.log(RpDebug.PREFIX + JSON.stringify(Object.assign({ t: Date.now(), event }, info || {})));
    } catch (_) {}
  }

  static image(name, b64) {
    try {
      const dir = RoleplayEnv.debugImageDir();
      if (!dir || !b64) return;
      fs.writeFileSync(path.join(dir, name), Buffer.from(b64, 'base64'));
    } catch (_) {}
  }
}

module.exports = RpDebug;
