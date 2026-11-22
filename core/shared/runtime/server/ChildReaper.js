const ChildProcessRegistry = require('../../../shell/ChildProcessRegistry');

class ChildReaper {
  static ESCALATE_MS = 5000;
  static CEILING_MS = 10000;

  static reap(child, { escalateMs = ChildReaper.ESCALATE_MS, ceilingMs = ChildReaper.CEILING_MS, ...how } = {}) {
    if (!child) return Promise.resolve();
    ChildReaper._signal(child, 'SIGTERM', how);
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(escalate);
        clearTimeout(ceiling);
        resolve();
      };
      child.once('exit', finish);
      const escalate = setTimeout(() => ChildReaper._signal(child, 'SIGKILL', how), escalateMs);
      const ceiling = setTimeout(finish, ceilingMs);
    });
  }

  static killNow(child, how = {}) {
    ChildReaper._signal(child, 'SIGKILL', how);
  }

  static _signal(child, signal, { tree = false, platform = process.platform, killTree = ChildProcessRegistry.killTree } = {}) {
    try {
      if (tree && platform === 'win32') killTree(child.pid);
      else child.kill(signal);
    } catch (_) {}
  }
}

module.exports = ChildReaper;
