const fs = require('fs');
const path = require('path');

class LocalShells {
  static PROBE_TIMEOUT_MS = 10 * 1000;
  static POSIX_PROBE_TIMEOUT_MS = 5000;
  static WINDOWS_CANDIDATES = [
    { name: 'pwsh', file: 'pwsh.exe' },
    { name: 'powershell', file: 'powershell.exe' },
  ];

  static probeWindows(spawnSync) {
    for (const c of LocalShells.WINDOWS_CANDIDATES) {
      if (LocalShells._answers(spawnSync, c.file, ['-NoProfile', '-NonInteractive', '-Command', '$PSVersionTable.PSVersion.Major'], { windowsHide: true, timeout: LocalShells.PROBE_TIMEOUT_MS, encoding: 'utf8' })) {
        return LocalShells.powershell(c.name, c.file);
      }
    }
    return LocalShells.powershell('powershell', 'powershell.exe');
  }

  static probePosix(spawnSync) {
    return LocalShells._answers(spawnSync, 'bash', ['-c', 'exit 0'], { timeout: LocalShells.POSIX_PROBE_TIMEOUT_MS })
      ? LocalShells.bash('bash')
      : LocalShells.sh();
  }

  static powershell(name, file) {
    return {
      name,
      file,
      syntax: 'PowerShell',
      argsFor: (cmd) => ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', Buffer.from(LocalShells.psScript(cmd), 'utf16le').toString('base64')],
    };
  }

  static bash(file) {
    return { name: 'bash', file, syntax: 'bash', argsFor: (cmd) => ['-lc', cmd] };
  }

  static sh() {
    return { name: 'sh', file: '/bin/sh', syntax: 'sh', argsFor: (cmd) => ['-c', cmd] };
  }

  static psScript(cmd) {
    const body = /^\s*["']/.test(cmd) ? `& ${cmd}` : cmd;
    return `${body}\nif ($null -ne $LASTEXITCODE) { exit $LASTEXITCODE }`;
  }

  static findGitBash(env = process.env, exists = fs.existsSync) {
    const roots = [env.ProgramFiles, env['ProgramFiles(x86)'], env.ProgramW6432].filter(Boolean);
    for (const root of roots) {
      const candidate = path.join(root, 'Git', 'bin', 'bash.exe');
      if (exists(candidate)) return candidate;
    }
    return null;
  }

  static _answers(spawnSync, file, args, options) {
    try {
      const r = spawnSync(file, args, options);
      return !!(r && !r.error && r.status === 0);
    } catch (_) {
      return false;
    }
  }
}

module.exports = LocalShells;
