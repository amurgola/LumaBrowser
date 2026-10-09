const PassthroughArgs = require('./PassthroughArgs');
const PrivilegeWrapper = require('./PrivilegeWrapper');

class ShellWrapper {
  static POSIX_SHELLS = ['bash', 'sh', 'zsh', 'dash', 'ksh'];
  static POSIX_COMMAND_FLAGS = ['-c', '-lc', '-ec', '-xc', '-ic'];
  static INLINE_RUNNERS = ['eval', 'exec', 'call', 'command', 'builtin'];
  static SOURCERS = ['source', '.'];

  static unwrap(name, args, dialect) {
    const lowered = args.map((arg) => arg.toLowerCase());
    const handler = ShellWrapper._handlerFor(name, dialect);
    if (handler) return handler(args, lowered, dialect);
    return ShellWrapper._privilege(name, args, dialect) || ShellWrapper._passthrough(name, args, dialect);
  }

  static opaque(tier = 'normal', reason = null) {
    return { command: '', opaque: true, tier, reason };
  }

  static _handlerFor(name, dialect) {
    if (ShellWrapper.POSIX_SHELLS.includes(name)) return ShellWrapper._posixShell;
    if (name === 'fish') return ShellWrapper._fish;
    if (name === 'cmd') return ShellWrapper._cmd;
    if (name === 'powershell' || name === 'pwsh') return ShellWrapper._powerShell;
    if (name === 'invoke-expression' || name === 'iex') return ShellWrapper._invokeExpression;
    if (name === 'invoke-command' || name === 'icm') return ShellWrapper._invokeCommand;
    if (name === 'start-process' || name === 'saps') return ShellWrapper._startProcess;
    if (name === 'start' && dialect !== 'posix') return ShellWrapper._cmdStart;
    if (ShellWrapper.SOURCERS.includes(name)) return () => ShellWrapper.opaque();
    if (ShellWrapper.INLINE_RUNNERS.includes(name)) return ShellWrapper._inline;
    return null;
  }

  static _posixShell(args, lowered) {
    const index = lowered.findIndex((arg) => ShellWrapper.POSIX_COMMAND_FLAGS.includes(arg));
    if (index >= 0 && args[index + 1] != null) return { command: args[index + 1], dialect: 'posix' };
    if (lowered.includes('-c')) return { command: '', dialect: 'posix' };
    if (args.every((arg) => arg.startsWith('-'))) return ShellWrapper.opaque('normal', 'An interactive shell cannot be inspected.');
    return ShellWrapper.opaque();
  }

  static _fish(args, lowered) {
    const index = lowered.indexOf('-c');
    return index >= 0 && args[index + 1] != null ? { command: args[index + 1], dialect: 'posix' } : ShellWrapper.opaque();
  }

  static _cmd(args, lowered) {
    const index = lowered.findIndex((arg) => arg === '/c' || arg === '/k' || arg === '/r');
    return index >= 0 ? { command: args.slice(index + 1).join(' '), dialect: 'cmd' } : ShellWrapper.opaque();
  }

  static _powerShell(args, lowered) {
    const command = lowered.findIndex((arg) => /^-(c|com|command)$/.test(arg));
    if (command >= 0) return { command: args.slice(command + 1).join(' '), dialect: 'powershell' };
    if (lowered.some((arg) => /^-(e|ec|enc|encodedcommand)$/.test(arg))) return ShellWrapper.opaque('mass-destructive', 'An encoded PowerShell command hides what it runs.');
    if (lowered.some((arg) => /^-(f|file)$/.test(arg))) return ShellWrapper.opaque();
    if (args.length && !args[0].startsWith('-')) return { command: args.join(' '), dialect: 'powershell' };
    return ShellWrapper.opaque();
  }

  static _invokeExpression(args) {
    const value = args.find((arg) => !arg.startsWith('-')) || '';
    if (/^\$|\(/.test(value)) return ShellWrapper.opaque('mass-destructive', 'Invoke-Expression on a variable runs code the classifier cannot see.');
    return { command: value, dialect: 'powershell' };
  }

  static _invokeCommand(args, lowered) {
    const index = lowered.findIndex((arg) => /^-(sc|scriptblock)$/.test(arg));
    const value = index >= 0 ? args[index + 1] : args.find((arg) => !arg.startsWith('-'));
    return value ? { command: value, dialect: 'powershell' } : ShellWrapper.opaque();
  }

  static _startProcess(args, lowered) {
    const filePath = lowered.findIndex((arg) => /^-(filepath|fp)$/.test(arg));
    const argumentList = lowered.findIndex((arg) => /^-(argumentlist|args)$/.test(arg));
    const exe = filePath >= 0 ? args[filePath + 1] : args.find((arg) => !arg.startsWith('-')) || '';
    const command = `${exe} ${argumentList >= 0 ? args[argumentList + 1] || '' : ''}`.trim();
    const elevated = lowered.includes('-verb') && lowered.includes('runas');
    return elevated ? { command, dialect: 'powershell', elevated: true } : { command, dialect: 'powershell' };
  }

  static _cmdStart(args, lowered, dialect) {
    const rest = args.filter((arg) => !/^\/[a-z]+$/i.test(arg));
    const words = rest[0] && rest[0].startsWith('"') ? rest.slice(1) : rest;
    return { command: words.join(' '), dialect };
  }

  static _inline(args, lowered, dialect) {
    return { command: args.join(' '), dialect };
  }

  static _privilege(name, args, dialect) {
    const inner = PrivilegeWrapper.unwrap(name, args);
    return inner ? { command: inner.join(' '), dialect, elevated: true } : null;
  }

  static _passthrough(name, args, dialect) {
    if (!PassthroughArgs.isPassthrough(name)) return null;
    const inner = PassthroughArgs.strip(name, args);
    if (!inner.length) return name === 'env' ? null : ShellWrapper.opaque();
    return { command: inner.join(' '), dialect: name === 'wsl' ? 'posix' : dialect };
  }
}

module.exports = ShellWrapper;
