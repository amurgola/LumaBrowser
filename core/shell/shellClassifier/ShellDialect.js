class ShellDialect {
  static POSIX = 'posix';
  static POWERSHELL = 'powershell';
  static CMD = 'cmd';
  static ALL = Object.freeze(['posix', 'powershell', 'cmd']);

  static POWERSHELL_ALIASES = ['pwsh', 'ps', 'powershell'];
  static CMD_ALIASES = ['cmd', 'cmd.exe', 'bat'];

  static normalize(dialect) {
    const name = String(dialect || ShellDialect.POSIX).toLowerCase();
    if (ShellDialect.POWERSHELL_ALIASES.includes(name)) return ShellDialect.POWERSHELL;
    if (ShellDialect.CMD_ALIASES.includes(name)) return ShellDialect.CMD;
    return ShellDialect.ALL.includes(name) ? name : ShellDialect.POSIX;
  }

  static guess(input, platform = process.platform) {
    const text = String(input || '');
    if (ShellDialect._looksLikePowerShell(text)) return ShellDialect.POWERSHELL;
    if (ShellDialect._looksLikeCmd(text)) return ShellDialect.CMD;
    if (ShellDialect._looksLikePosix(text)) return ShellDialect.POSIX;
    if (/[A-Za-z]:\\|\\\\/.test(text)) return ShellDialect.POWERSHELL;
    return platform === 'win32' ? ShellDialect.POWERSHELL : ShellDialect.POSIX;
  }

  static _looksLikePowerShell(text) {
    if (/(^|[\s;|&(])(?:[A-Z][a-z]+-[A-Z][A-Za-z]+)\b/.test(text)) return true;
    return /\$env:|\$PSVersionTable|\$_\b|-Recurse\b|-Force\b|-LiteralPath\b|-ErrorAction\b/i.test(text);
  }

  static _looksLikeCmd(text) {
    return /%[A-Za-z_][A-Za-z0-9_]*%/.test(text) || /(^|[\s&|])(?:del|erase|rd|xcopy|robocopy|findstr)\s+\/[a-z]/i.test(text);
  }

  static _looksLikePosix(text) {
    return /(^|[\s;|&])(?:\.\/|bash\b|sh\b|sudo\b|chmod\b|chown\b)|\$\(|\$\{|\|\s*(?:sh|bash|zsh)\b|&>|2>&1/.test(text);
  }
}

module.exports = ShellDialect;
