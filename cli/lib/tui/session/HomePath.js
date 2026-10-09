const os = require('os');

class HomePath {
  static tildify(p, home = os.homedir()) {
    if (p && home && p.toLowerCase().startsWith(home.toLowerCase())) return `~${p.slice(home.length)}`;
    return p;
  }
}

module.exports = HomePath;
