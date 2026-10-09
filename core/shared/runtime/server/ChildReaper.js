class ChildReaper {
  static ESCALATE_MS = 5000;
  static CEILING_MS = 10000;

  static reap(child, { escalateMs = ChildReaper.ESCALATE_MS, ceilingMs = ChildReaper.CEILING_MS } = {}) {
    if (!child) return Promise.resolve();
    ChildReaper._signal(child, 'SIGTERM');
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
      const escalate = setTimeout(() => ChildReaper._signal(child, 'SIGKILL'), escalateMs);
      const ceiling = setTimeout(finish, ceilingMs);
    });
  }

  static killNow(child) {
    ChildReaper._signal(child, 'SIGKILL');
  }

  static _signal(child, signal) {
    try { child.kill(signal); } catch (_) {}
  }
}

module.exports = ChildReaper;
