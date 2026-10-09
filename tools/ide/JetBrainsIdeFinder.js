const fs = require('fs');
const os = require('os');
const path = require('path');

class JetBrainsIdeFinder {
  static installed({ platform = process.platform, env = process.env, home = os.homedir(), fsImpl = fs } = {}) {
    const found = [];
    for (const root of JetBrainsIdeFinder.searchRoots(platform, env, home)) {
      for (const name of JetBrainsIdeFinder._list(fsImpl, root)) {
        const ide = JetBrainsIdeFinder._probe(fsImpl, platform, path.join(root, name), name);
        if (ide) found.push(ide);
      }
    }
    return found.sort((a, b) => JetBrainsIdeFinder._buildNumber(b).localeCompare(JetBrainsIdeFinder._buildNumber(a), undefined, { numeric: true }));
  }

  static searchRoots(platform, env, home) {
    if (platform === 'win32') {
      const local = env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
      return [path.join(local, 'Programs'), path.join(local, 'JetBrains', 'Toolbox', 'apps'), 'C:\\Program Files\\JetBrains'];
    }
    if (platform === 'darwin') return ['/Applications', path.join(home, 'Applications')];
    return ['/opt', path.join(home, '.local', 'share', 'JetBrains', 'Toolbox', 'apps')];
  }

  static _list(fsImpl, root) {
    try { return fsImpl.readdirSync(root); } catch (_) { return []; }
  }

  static _probe(fsImpl, platform, dir, name) {
    const ideHome = platform === 'darwin' && name.endsWith('.app') ? path.join(dir, 'Contents') : dir;
    if (!fsImpl.existsSync(path.join(ideHome, 'product-info.json')) && !fsImpl.existsSync(path.join(ideHome, 'build.txt'))) return null;
    let build = '';
    try { build = String(fsImpl.readFileSync(path.join(ideHome, 'build.txt'), 'utf8')).trim(); } catch (_) {}
    return { name, home: ideHome, build };
  }

  static _buildNumber(ide) {
    return ide.build.replace(/^[A-Z]+-/, '');
  }
}

module.exports = JetBrainsIdeFinder;
