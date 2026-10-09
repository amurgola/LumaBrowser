const ShellWords = require('./ShellWords');

class PrivilegeWrapper {
  static NAMES = new Set(['sudo', 'doas', 'su', 'pkexec', 'runas', 'gsudo', 'sudo.exe']);

  static SUDO_OPTIONS_WITH_VALUE = new Set(['-u', '--user', '-g', '-p', '-h', '-C', '-r', '-t']);

  static ESCALATED_WRITERS = new Set([
    'chgrp', 'chmod', 'chown', 'cp', 'del', 'install', 'ln', 'mv', 'rd', 'remove-item', 'rm', 'rmdir', 'sed',
    'set-content', 'shred', 'tee', 'truncate',
    'bcdedit', 'dd', 'diskpart', 'format', 'mkfs', 'mount', 'reg', 'umount',
    'crontab', 'kill', 'killall', 'launchctl', 'pkill', 'service', 'systemctl',
    'apt', 'apt-get', 'brew', 'dnf', 'npm', 'pacman', 'pip', 'yum',
    'chpasswd', 'iptables', 'nft', 'passwd', 'ufw', 'useradd', 'userdel', 'usermod', 'visudo',
    'bash', 'cmd', 'node', 'perl', 'powershell', 'pwsh', 'python', 'python3', 'ruby', 'sh', 'zsh',
  ]);

  static unwrap(name, args) {
    const n = ShellWords.lower(name);
    if (!PrivilegeWrapper.NAMES.has(n)) return null;
    if (n === 'su') return PrivilegeWrapper._su(args);
    if (n === 'runas') return PrivilegeWrapper._runas(args);
    return PrivilegeWrapper._sudoLike(args);
  }

  static _su(args) {
    const index = args.indexOf('-c');
    return index >= 0 ? ShellWords.splitWords(args[index + 1] || '') : [];
  }

  static _runas(args) {
    const inner = args.find((arg) => !arg.startsWith('/'));
    return inner ? ShellWords.splitWords(inner) : [];
  }

  static _sudoLike(args) {
    let i = 0;
    while (i < args.length) {
      const arg = args[i];
      if (arg === '--') { i++; break; }
      if (PrivilegeWrapper.SUDO_OPTIONS_WITH_VALUE.has(arg)) { i += 2; continue; }
      if (!arg.startsWith('-')) break;
      i++;
    }
    return args.slice(i);
  }
}

module.exports = PrivilegeWrapper;
