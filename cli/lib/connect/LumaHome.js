const os = require('os');
const path = require('path');

class LumaHome {
  static DIR_NAME = '.lumabrowser';

  static dir() {
    return path.join(os.homedir(), LumaHome.DIR_NAME);
  }

  static file(name) {
    return path.join(LumaHome.dir(), name);
  }
}

module.exports = LumaHome;
