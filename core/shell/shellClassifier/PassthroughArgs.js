class PassthroughArgs {
  static NAMES = new Set(['env', 'nohup', 'time', 'timeout', 'nice', 'ionice', 'xargs', 'watch', 'strace', 'ltrace', 'caffeinate', 'script', 'stdbuf', 'unbuffer', 'chronic', 'ts', 'busybox', 'wsl', 'wsl.exe']);

  static VALUE_FLAGS = Object.freeze({
    env: ['-u', '-C', '-S'], nohup: [], time: ['-f', '-o'], timeout: ['-s', '-k', '--signal', '--kill-after'],
    nice: ['-n'], ionice: ['-c', '-n', '-p'], xargs: ['-I', '-n', '-P', '-d', '-L', '-s', '-a', '-E'], watch: ['-n', '-d'],
    strace: ['-o', '-e', '-p'], ltrace: ['-o', '-e'], caffeinate: ['-t', '-w'], script: ['-c'], stdbuf: ['-i', '-o', '-e'],
    unbuffer: [], chronic: [], ts: [], busybox: [], wsl: ['-d', '--distribution', '-u', '--user', '--cd', '-e', '--exec'],
  });

  static isPassthrough(name) {
    return PassthroughArgs.NAMES.has(name);
  }

  static strip(name, args) {
    const valueFlags = PassthroughArgs.VALUE_FLAGS[name] || [];
    if (name === 'timeout' || name === 'watch') return PassthroughArgs._afterLeadingFlags(name, args, valueFlags);
    if (name === 'script') return PassthroughArgs._scriptCommand(args);
    if (name === 'env') return PassthroughArgs._envCommand(args, valueFlags);
    return args.slice(PassthroughArgs._commandStart(name, args, valueFlags));
  }

  static _envCommand(args, valueFlags) {
    const start = PassthroughArgs._commandStart('env', args, valueFlags);
    const command = args.slice(start);
    if (!command.length) return [];
    const assignments = args.slice(0, start).filter((arg) => PassthroughArgs._isAssignment(arg));
    return [...assignments.map((arg) => PassthroughArgs._quotedAssignment(arg)), ...command];
  }

  static _isAssignment(arg) {
    return arg.includes('=') && !arg.startsWith('-');
  }

  static _quotedAssignment(arg) {
    const split = arg.indexOf('=');
    const value = arg.slice(split + 1).split("'").join("'\"'\"'");
    return `${arg.slice(0, split)}='${value}'`;
  }

  static _afterLeadingFlags(name, args, valueFlags) {
    let i = 0;
    while (i < args.length && args[i].startsWith('-')) {
      if (valueFlags.includes(args[i])) i++;
      i++;
    }
    if (name === 'timeout' && i < args.length) i++;
    return args.slice(i);
  }

  static _scriptCommand(args) {
    const index = args.indexOf('-c');
    return index >= 0 ? [args[index + 1] || ''] : [];
  }

  static _commandStart(name, args, valueFlags) {
    let i = 0;
    while (i < args.length) {
      const arg = args[i];
      if (name === 'env' && PassthroughArgs._isAssignment(arg)) { i++; continue; }
      if (arg === '--') return i + 1;
      if (!arg.startsWith('-')) return i;
      if (PassthroughArgs._takesValue(arg, valueFlags)) i++;
      i++;
    }
    return i;
  }

  static _takesValue(arg, valueFlags) {
    return valueFlags.includes(arg) || (valueFlags.includes(arg.slice(0, 2)) && arg.length === 2);
  }
}

module.exports = PassthroughArgs;
