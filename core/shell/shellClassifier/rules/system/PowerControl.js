const HostCapability = require('./HostCapability');
const SystemctlArgs = require('./SystemctlArgs');

class PowerControl extends HostCapability {
  static ENDS_SESSION = 'Power control would end the working session.';

  static POWER_PROGRAMS = new Set(['halt', 'logoff', 'poweroff', 'reboot', 'restart-computer', 'shutdown', 'stop-computer']);
  static HARMLESS_ARGS = new Set(['--help', '--wtmp-only', '-c', '-k', '-w', '-whatif', '/?', '/a']);
  static ENDING_RUNLEVELS = new Set(['0', '1', '6', 's', 'single']);
  static SYSTEMCTL_VERBS = new Set([
    'default', 'emergency', 'exit', 'halt', 'hibernate', 'hybrid-sleep', 'kexec', 'poweroff', 'reboot', 'rescue',
    'sleep', 'soft-reboot', 'suspend', 'suspend-then-hibernate', 'switch-root',
  ]);
  static ENDING_TARGETS = new Set(['emergency', 'halt', 'kexec', 'poweroff', 'reboot', 'rescue', 'shutdown', 'soft-reboot']);
  static LOGINCTL_VERBS = new Set([
    'halt', 'hibernate', 'hybrid-sleep', 'kill-session', 'kill-user', 'lock-session', 'lock-sessions', 'poweroff', 'reboot',
    'sleep', 'suspend', 'suspend-then-hibernate', 'terminate-session', 'terminate-user',
  ]);
  static RUNDLL_ENDINGS = ['powrprof.dll', 'shell32.dll,shexitwindowsex', 'user32.dll,exitwindowsex', 'user32.dll,lockworkstation'];

  static ENDERS = Object.freeze({
    init: PowerControl._switchesRunlevel,
    telinit: PowerControl._switchesRunlevel,
    systemctl: PowerControl._systemdEnds,
    loginctl: (command) => PowerControl.LOGINCTL_VERBS.has(command.positionals[0]),
    launchctl: (command) => command.positionals[0] === 'reboot',
    rundll32: (command) => command.lowered.some((arg) => PowerControl.RUNDLL_ENDINGS.some((entry) => arg.includes(entry))),
    pmset: (command) => command.positionals[0] === 'sleepnow',
    kexec: (command) => command.has('-e', '--exec'),
  });

  covers(command) {
    return PowerControl.POWER_PROGRAMS.has(command.name) || this._endsSession(command);
  }

  judge(command) {
    if (!PowerControl.POWER_PROGRAMS.has(command.name)) return HostCapability.forbid(PowerControl.ENDS_SESSION);
    return command.has(...PowerControl.HARMLESS_ARGS) ? null : HostCapability.forbid(PowerControl.ENDS_SESSION);
  }

  _endsSession(command) {
    const ender = Object.hasOwn(PowerControl.ENDERS, command.name) ? PowerControl.ENDERS[command.name] : null;
    return Boolean(ender && ender(command));
  }

  static _switchesRunlevel(command) {
    return command.positionals.some((word) => PowerControl.ENDING_RUNLEVELS.has(word));
  }

  static _systemdEnds(command) {
    const [verb, target = ''] = SystemctlArgs.positionals(command);
    if (PowerControl.SYSTEMCTL_VERBS.has(verb)) return true;
    return verb === 'isolate' && PowerControl.ENDING_TARGETS.has(target.replace(/\.target$/, ''));
  }
}

module.exports = PowerControl;
