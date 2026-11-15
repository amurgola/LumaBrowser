const fs = require('fs');
const os = require('os');
const InheritedDebugEnv = require('./InheritedDebugEnv');

class ShellLaunch {
  static TERM_PROGRAM = 'LumaBrowser';
  static COLORFGBG = '15;0';
  static STRIPPED_ENV = /^ELECTRON_/i;
  static DEFAULT_CMD_PROMPT = '$P$G';

  constructor({ files, baseEnv = process.env, appVersion = '', isDirectory = ShellLaunch._isDirectory, homeDir = os.homedir }) {
    this._files = files;
    this._baseEnv = baseEnv;
    this._appVersion = appVersion;
    this._isDirectory = isDirectory;
    this._homeDir = homeDir;
  }

  build(shell, options = {}) {
    const start = this._startFor(shell, options.startupCommand || null);
    return {
      file: shell.file,
      args: start.args,
      cwd: this._cwd(options.cwd),
      env: this._env(shell, start.env, options),
      profileId: options.profileId || shell.id,
      label: options.label || shell.label,
    };
  }

  _startFor(shell, startupCommand) {
    const builders = { powershell: '_powershell', cmd: '_cmd', bash: '_bash', zsh: '_zsh', fish: '_fish' };
    const build = builders[shell.family];
    return build ? this[build](shell, startupCommand) : ShellLaunch._plain(shell, startupCommand);
  }

  _powershell(shell, startupCommand) {
    const script = `${this._files.powershellScript()}\n${startupCommand || ''}\n`;
    return { args: [...shell.args, '-NoLogo', '-NoExit', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], env: {} };
  }

  _cmd(shell, startupCommand) {
    const own = this._baseEnv.PROMPT || ShellLaunch.DEFAULT_CMD_PROMPT;
    const prompt = `$E]633;D$E\\$E]9;9;$P$E\\$E]633;A$E\\${own}$E]633;B$E\\`;
    return { args: [...shell.args, ...(startupCommand ? ['/K', startupCommand] : [])], env: { PROMPT: prompt } };
  }

  _bash(shell, startupCommand) {
    return {
      args: [...shell.args, '--init-file', this._files.bashInitFile(), '-i'],
      env: { ...(shell.login ? { LUMA_BASH_LOGIN: '1', CHERE_INVOKING: '1' } : {}), ...ShellLaunch._startup(startupCommand) },
    };
  }

  _zsh(shell, startupCommand) {
    return {
      args: [...shell.args, ...(shell.login ? ['-l'] : []), '-i'],
      env: { ZDOTDIR: this._files.zshDotDir(), LUMA_USER_ZDOTDIR: this._baseEnv.ZDOTDIR || '', ...ShellLaunch._startup(startupCommand) },
    };
  }

  _fish(shell, startupCommand) {
    return { args: [...shell.args, ...(shell.login ? ['-l'] : []), ...(startupCommand ? ['-C', startupCommand] : [])], env: {} };
  }

  static _plain(shell, startupCommand) {
    return { args: [...shell.args, ...(startupCommand ? ['-c', startupCommand] : [])], env: {} };
  }

  static _startup(startupCommand) {
    return startupCommand ? { LUMA_STARTUP_COMMAND: startupCommand } : {};
  }

  _env(shell, startEnv, options) {
    const env = {};
    for (const [key, value] of Object.entries(InheritedDebugEnv.forUserShell(this._baseEnv))) {
      if (value != null && !ShellLaunch.STRIPPED_ENV.test(key)) env[key] = String(value);
    }
    return {
      ...env, ...(shell.env || {}), ...(options.extraEnv || {}), ...startEnv, ...(options.sessionEnv || {}),
      TERM_PROGRAM: ShellLaunch.TERM_PROGRAM, TERM_PROGRAM_VERSION: this._appVersion, COLORTERM: 'truecolor',
      COLORFGBG: ShellLaunch.COLORFGBG,
    };
  }

  _cwd(requested) {
    return requested && this._isDirectory(requested) ? requested : this._homeDir();
  }

  static _isDirectory(dir) {
    try { return fs.statSync(dir).isDirectory(); } catch (_) { return false; }
  }
}

module.exports = ShellLaunch;
