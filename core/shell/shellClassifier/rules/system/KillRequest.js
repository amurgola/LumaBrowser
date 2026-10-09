const PowerShellArgs = require('../../PowerShellArgs');
const ProcessPattern = require('./ProcessPattern');

class KillRequest {
  static HARD_SIGNALS = new Set(['9', 'kill']);
  static PKILL_VALUE_OPTIONS = ['-u', '-U', '-g', '-G', '-P', '-s', '-t', '-F', '--uid', '--euid', '--group', '--pgroup', '--parent', '--session', '--terminal', '--pidfile', '--ns', '--nslist', '--signal'];
  static KILLALL_VALUE_OPTIONS = ['-s', '--signal', '-u', '--user', '-o', '--older-than', '-y', '--younger-than', '-c'];
  static USER_OPTIONS = ['-u', '-U', '--uid', '--euid', '--user'];
  static STOP_PROCESS_NAMES = new Set(['stop-process', 'spps']);
  static READERS = Object.freeze({
    kill: KillRequest._kill, pkill: KillRequest._pkill, killall: KillRequest._killall, taskkill: KillRequest._taskkill, tskill: KillRequest._tskill,
  });

  constructor({ hard = false, pids = [], patterns = [], tree = false, userWide = false, filtered = false, platform }) {
    Object.assign(this, { hard, pids, patterns, tree, userWide, filtered, platform });
    Object.freeze(this);
  }

  static parse(command) {
    if (KillRequest.STOP_PROCESS_NAMES.has(command.name) || (command.name === 'kill' && command.dialect === 'powershell')) {
      return KillRequest._stopProcess(command);
    }
    const own = Object.hasOwn(KillRequest.READERS, command.name);
    return own ? KillRequest.READERS[command.name](command) : null;
  }

  static isHardSignal(signal) {
    return KillRequest.HARD_SIGNALS.has(String(signal ?? '').toLowerCase().replace(/^sig/, ''));
  }

  static _kill(command) {
    const pids = [];
    let signal = null;
    let optionsDone = false;
    for (let i = 0; i < command.args.length; i++) {
      const arg = command.args[i];
      if (!optionsDone && arg === '--') optionsDone = true;
      else if (!optionsDone && signal === null && ['-s', '-n', '--signal'].includes(arg)) signal = command.args[++i] ?? '';
      else if (!optionsDone && signal === null && /^--signal=/.test(arg)) signal = arg.slice(9);
      else if (!optionsDone && signal === null && /^-[A-Za-z0-9]+$/.test(arg) && !pids.length) signal = arg.slice(1);
      else pids.push(arg);
    }
    return new KillRequest({ hard: KillRequest.isHardSignal(signal), pids, platform: 'posix' });
  }

  static _pkill(command) {
    return KillRequest._byName(command, KillRequest.PKILL_VALUE_OPTIONS, ['--signal']);
  }

  static _killall(command) {
    return KillRequest._byName(command, KillRequest.KILLALL_VALUE_OPTIONS, ['-s', '--signal']);
  }

  static _byName(command, valueOptions, signalOptions) {
    const names = command.positionalsSkipping(valueOptions);
    const hard = command.args.some((arg, i) => /^-(9|kill|sigkill)$/i.test(arg) || /^--signal=(sig)?(9|kill)$/i.test(arg)
      || (signalOptions.includes(arg) && KillRequest.isHardSignal(command.args[i + 1])));
    const userWide = !names.length && command.args.some((arg) => KillRequest.USER_OPTIONS.includes(arg));
    const patterns = names.map((name) => new ProcessPattern(name, ProcessPattern.REGEX));
    return new KillRequest({ hard, patterns, userWide, platform: 'posix' });
  }

  static _taskkill(command) {
    const valuesOf = (flag) => command.lowered.flatMap((arg, i) => (arg === flag && i + 1 < command.lowered.length ? [command.args[i + 1]] : []));
    return new KillRequest({
      hard: command.has('/f'),
      tree: command.has('/t'),
      filtered: command.has('/fi'),
      pids: valuesOf('/pid'),
      patterns: valuesOf('/im').map((name) => new ProcessPattern(name, ProcessPattern.GLOB)),
      platform: 'windows',
    });
  }

  static _tskill(command) {
    const [target = ''] = command.positionals;
    const numeric = KillRequest._isNumber(target);
    return new KillRequest({
      hard: true,
      pids: numeric ? [target] : [],
      patterns: numeric || !target ? [] : [new ProcessPattern(target, ProcessPattern.EXACT)],
      platform: 'windows',
    });
  }

  static _stopProcess(command) {
    const positionals = PowerShellArgs.positionals(command.args).flatMap(PowerShellArgs.splitList);
    const ids = KillRequest._unique(KillRequest._listParam(command, ['Id']), positionals.filter(KillRequest._isNumber));
    const names = KillRequest._unique(KillRequest._listParam(command, ['Name', 'ProcessName']), positionals.filter((word) => !KillRequest._isNumber(word)));
    return new KillRequest({ hard: true, pids: ids, patterns: names.map((name) => new ProcessPattern(name, ProcessPattern.GLOB)), platform: 'windows' });
  }

  static _listParam(command, names) {
    const value = PowerShellArgs.param(command.args, names);
    return typeof value === 'string' ? PowerShellArgs.splitList(value) : [];
  }

  static _unique(...lists) {
    return [...new Set(lists.flat())];
  }

  static _isNumber(word) {
    return /^\d+$/.test(word);
  }
}

module.exports = KillRequest;
