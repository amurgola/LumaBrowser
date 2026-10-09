const { spawn } = require('child_process');

class AppProcess {
  static launch(executable, args = [], { platform = process.platform, env = process.env, spawnFn = spawn } = {}) {
    const childEnv = AppProcess._appEnv(env);
    const options = { stdio: 'ignore', detached: true, env: childEnv };
    const child = AppProcess._isMacBundle(executable, platform)
      ? spawnFn('open', ['-a', executable, '--args', ...args], options)
      : spawnFn(executable, args, options);
    child.unref();
    return child;
  }

  static _appEnv(env) {
    const copy = { ...env };
    delete copy.ELECTRON_RUN_AS_NODE;
    return copy;
  }

  static _isMacBundle(executable, platform) {
    return platform === 'darwin' && String(executable).endsWith('.app');
  }
}

module.exports = AppProcess;
