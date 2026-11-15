const fs = require('fs');
const path = require('path');
const LocalShells = require('../../shell/command-runner/LocalShells');
const ExecutableFinder = require('../../shell/harness-connections/ExecutableFinder');

class ShellProfiles {
  static ETC_SHELLS = '/etc/shells';
  static POSIX_FAMILIES = Object.freeze({ bash: 'bash', zsh: 'zsh', fish: 'fish' });
  static POSIX_LABELS = Object.freeze({ bash: 'Bash', zsh: 'Zsh', fish: 'Fish', sh: 'sh' });
  static POSIX_FALLBACK = '/bin/sh';
  static POWERSHELL_7_DIR = ['PowerShell', '7'];
  static APP_ALIAS_DIR = ['Microsoft', 'WindowsApps'];

  static detect({ platform = process.platform, env = process.env, exists = fs.existsSync, readFile = fs.readFileSync, find = ExecutableFinder.find, aliasExists = ShellProfiles._linkExists } = {}) {
    return platform === 'win32'
      ? ShellProfiles._windows(env, exists, find, aliasExists)
      : ShellProfiles._posix(platform, env, exists, readFile);
  }

  static _windows(env, exists, find, aliasExists) {
    const system32 = path.win32.join(env.SystemRoot || env.windir || 'C:\\Windows', 'System32');
    const pwsh = ShellProfiles._findPowerShell7(env, exists, find, aliasExists);
    const windowsPowerShell = path.win32.join(system32, 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const gitBash = LocalShells.findGitBash(env, exists);
    const wsl = path.win32.join(system32, 'wsl.exe');
    return [
      pwsh && ShellProfiles._profile('pwsh', 'PowerShell', 'powershell', pwsh),
      exists(windowsPowerShell) && ShellProfiles._profile('powershell', 'Windows PowerShell', 'powershell', windowsPowerShell),
      ShellProfiles._profile('cmd', 'Command Prompt', 'cmd', env.ComSpec || path.win32.join(system32, 'cmd.exe')),
      gitBash && ShellProfiles._profile('gitbash', 'Git Bash', 'bash', gitBash, { login: true }),
      exists(wsl) && ShellProfiles._profile('wsl', 'WSL', 'wsl', wsl),
    ].filter(Boolean);
  }

  static _findPowerShell7(env, exists, find, aliasExists) {
    const onPath = find('pwsh', env.PATH || '', env, 'win32');
    if (onPath) return onPath;
    const installed = env.ProgramFiles && path.win32.join(env.ProgramFiles, ...ShellProfiles.POWERSHELL_7_DIR, 'pwsh.exe');
    if (installed && exists(installed)) return installed;
    const alias = env.LOCALAPPDATA && path.win32.join(env.LOCALAPPDATA, ...ShellProfiles.APP_ALIAS_DIR, 'pwsh.exe');
    return alias && aliasExists(alias) ? alias : null;
  }

  static _linkExists(file) {
    try { fs.lstatSync(file); return true; } catch (_) { return false; }
  }

  static _posix(platform, env, exists, readFile) {
    const login = platform === 'darwin';
    const files = [env.SHELL, ...ShellProfiles._listedShells(readFile)].filter((file) => file && exists(file));
    const profiles = [];
    for (const file of files.length ? files : [ShellProfiles.POSIX_FALLBACK]) {
      const name = path.posix.basename(file);
      if (profiles.some((profile) => profile.id === name)) continue;
      const family = ShellProfiles.POSIX_FAMILIES[name] || 'other';
      profiles.push(ShellProfiles._profile(name, ShellProfiles.POSIX_LABELS[name] || name, family, file, { login }));
    }
    return profiles;
  }

  static _listedShells(readFile) {
    try {
      return String(readFile(ShellProfiles.ETC_SHELLS, 'utf8')).split('\n').map((line) => line.trim()).filter((line) => line.startsWith('/'));
    } catch (_) {
      return [];
    }
  }

  static _profile(id, label, family, file, { login = false } = {}) {
    return { id, label, kind: 'shell', family, file, args: [], login, source: 'system' };
  }
}

module.exports = ShellProfiles;
