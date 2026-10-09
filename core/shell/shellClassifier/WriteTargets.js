const ShellWords = require('./ShellWords');
const PowerShellArgs = require('./PowerShellArgs');

class WriteTargets {
  static POSIX_WRITE_ARGS = new Set([
    'install', 'ln', 'mkdir', 'mkfifo', 'mknod', 'touch',
    'mv', 'rm', 'rmdir', 'shred', 'truncate', 'unlink',
    'chgrp', 'chmod', 'chown',
    'patch', 'rsync', 'tar', 'tee', 'unzip',
  ]);
  static POSIX_WRITE_LAST_ARG = new Set(['cp', 'scp', 'dd']);
  static PS_WRITE_PATH = new Set(['remove-item', 'ri', 'del', 'erase', 'rd', 'rmdir', 'rm', 'new-item', 'ni', 'md', 'mkdir', 'set-content', 'sc', 'add-content', 'ac', 'out-file', 'clear-content', 'clc', 'set-itemproperty', 'sp', 'rename-item', 'ren', 'rni', 'move-item', 'mv', 'move', 'mi', 'copy-item', 'cp', 'copy', 'cpi', 'export-csv', 'export-clixml', 'compress-archive', 'expand-archive', 'invoke-webrequest', 'iwr', 'curl', 'wget', 'start-bitstransfer', 'set-acl', 'new-itemproperty']);
  static CMD_WRITE = new Set(['del', 'erase', 'rd', 'rmdir', 'md', 'mkdir', 'copy', 'move', 'ren', 'rename', 'xcopy', 'robocopy', 'attrib', 'icacls', 'takeown']);

  static PS_NAMED_TARGETS = ['Path', 'LiteralPath', 'Destination', 'FilePath', 'DestinationPath', 'OutFile', 'NewName'];
  static PS_COPY = ['copy-item', 'cp', 'copy', 'cpi'];
  static PS_MOVE = ['move-item', 'mv', 'move', 'mi', 'rename-item', 'ren', 'rni'];
  static PS_DOWNLOAD = ['invoke-webrequest', 'iwr', 'curl', 'wget', 'start-bitstransfer'];
  static PS_ITEM_TYPES = /^(file|directory|symboliclink|junction|hardlink)$/i;
  static CMD_COPY_LIKE = ['copy', 'move', 'xcopy', 'robocopy', 'ren', 'rename'];
  static CMD_SOURCE_REMOVED = ['move', 'ren', 'rename'];

  static of(name, args, dialect) {
    const n = ShellWords.lower(name);
    if (dialect === 'powershell' && WriteTargets.PS_WRITE_PATH.has(n)) return WriteTargets._powerShell(n, args);
    if ((dialect === 'cmd' || dialect === 'powershell') && WriteTargets.CMD_WRITE.has(n)) return WriteTargets._cmd(n, args);
    return WriteTargets._posix(n, args);
  }

  static _powerShell(n, args) {
    const named = WriteTargets._psNamedTargets(args);
    const positional = PowerShellArgs.positionals(args).flatMap(PowerShellArgs.splitList);
    const targets = named.concat(WriteTargets._psPositionalTargets(n, args, positional));
    return targets.filter((target) => !/^\$(null|_)$/i.test(target));
  }

  static _psNamedTargets(args) {
    return WriteTargets.PS_NAMED_TARGETS.flatMap((param) => {
      const value = PowerShellArgs.param(args, [param]);
      return typeof value === 'string' ? PowerShellArgs.splitList(value) : [];
    });
  }

  static _psPositionalTargets(n, args, positional) {
    if (WriteTargets.PS_COPY.includes(n) || WriteTargets.PS_MOVE.includes(n)) return WriteTargets._psCopyOrMove(n, args, positional);
    if (WriteTargets.PS_DOWNLOAD.includes(n)) return [];
    if (n === 'new-item' || n === 'ni') return positional.filter((word) => !WriteTargets.PS_ITEM_TYPES.test(word));
    return positional;
  }

  static _psCopyOrMove(n, args, positional) {
    const out = [];
    if (positional.length >= 2) out.push(positional[positional.length - 1]);
    if (!WriteTargets.PS_COPY.includes(n) && positional.length >= 1) out.push(positional[0]);
    if (positional.length === 1 && !WriteTargets._hasNamedString(args)) out.push(positional[0]);
    return out;
  }

  static _hasNamedString(args) {
    return WriteTargets.PS_NAMED_TARGETS.some((param) => typeof PowerShellArgs.param(args, [param]) === 'string');
  }

  static _cmd(n, args) {
    const positional = args.filter((arg) => !/^\/[a-z:]+/i.test(arg));
    if (!WriteTargets.CMD_COPY_LIKE.includes(n)) return positional;
    if (n === 'robocopy') return positional.length >= 2 ? [positional[1]] : [];
    const destination = positional.length >= 2 ? [positional[positional.length - 1]] : [];
    return WriteTargets.CMD_SOURCE_REMOVED.includes(n) ? destination.concat(positional.slice(0, 1)) : destination;
  }

  static _posix(n, args) {
    if (n === 'curl') return WriteTargets._curl(args);
    if (n === 'wget') return WriteTargets._wget(args);
    if (WriteTargets.POSIX_WRITE_ARGS.has(n)) return WriteTargets._posixWriteArgs(n, args);
    if (WriteTargets.POSIX_WRITE_LAST_ARG.has(n)) return WriteTargets._posixLastArg(n, args);
    if (n === 'sed' && WriteTargets._sedInPlace(args)) return WriteTargets._sedFile(args);
    return null;
  }

  static _curl(args) {
    const out = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '-o' || arg === '--output') out.push(args[i + 1] || '');
      else if (arg.startsWith('--output=')) out.push(arg.slice('--output='.length));
      else if (/^-o./.test(arg) && !arg.startsWith('--')) out.push(arg.slice(2));
      else if (arg === '-O' || arg === '--remote-name') out.push('.');
    }
    return out.filter(Boolean);
  }

  static _wget(args) {
    const out = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '-O' || arg === '--output-document') out.push(args[i + 1] || '');
      else if (arg.startsWith('--output-document=')) out.push(arg.slice('--output-document='.length));
      else if (arg === '-P' || arg === '--directory-prefix') out.push(args[i + 1] || '');
      else if (arg.startsWith('--directory-prefix=')) out.push(arg.slice('--directory-prefix='.length));
    }
    return out.length ? out.filter(Boolean) : ['.'];
  }

  static _posixWriteArgs(n, args) {
    if (n === 'tar') return WriteTargets._tar(args);
    if (n === 'unzip') return [WriteTargets._valueAfter(args, '-d')];
    if (n === 'patch') return ['.'];
    return ShellWords.nonFlags(args);
  }

  static _tar(args) {
    if (!args.some((arg) => /^-[a-z]*x/.test(arg) || arg === '--extract')) return [];
    return [WriteTargets._valueAfter(args, '-C')];
  }

  static _valueAfter(args, flag) {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] || '.' : '.';
  }

  static _posixLastArg(n, args) {
    if (n === 'dd') return args.filter((arg) => arg.startsWith('of=')).map((arg) => arg.slice(3));
    const positional = ShellWords.nonFlags(args);
    return positional.length >= 2 ? [positional[positional.length - 1]] : [];
  }

  static _sedInPlace(args) {
    return args.some((arg) => arg === '-i' || arg === '--in-place' || (/^-[a-z]*i/.test(arg) && !arg.startsWith('--')));
  }

  static _sedFile(args) {
    return args.filter((arg) => !arg.startsWith('-') && !/^s[/|#]/.test(arg) && !/^\d*[sdp]\b/.test(arg)).slice(-1);
  }
}

module.exports = WriteTargets;
