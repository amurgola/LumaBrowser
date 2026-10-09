const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

class JavaHomeFinder {
  static find(ides, { platform = process.platform, env = process.env, exists = fs.existsSync, run = spawnSync } = {}) {
    const check = (dir) => (dir && exists(path.join(dir, 'bin', platform === 'win32' ? 'java.exe' : 'java')) ? dir : null);
    const fromEnv = check(env.JAVA_HOME);
    if (fromEnv) return { home: fromEnv, source: 'JAVA_HOME' };
    for (const ide of ides) {
      const jbr = check(JavaHomeFinder.jbrOf(ide, platform));
      if (jbr) return { home: jbr, source: `JBR of ${ide.name}` };
    }
    return JavaHomeFinder._fromPath(platform, run);
  }

  static jbrOf(ide, platform) {
    return platform === 'darwin' ? path.join(ide.home, 'jbr', 'Contents', 'Home') : path.join(ide.home, 'jbr');
  }

  static _fromPath(platform, run) {
    const which = run(platform === 'win32' ? 'where' : 'which', ['java'], { encoding: 'utf8' });
    if (which.status !== 0 || !which.stdout || !which.stdout.trim()) return null;
    const exe = which.stdout.trim().split(/\r?\n/)[0];
    return { home: path.dirname(path.dirname(exe)), source: 'PATH' };
  }
}

module.exports = JavaHomeFinder;
