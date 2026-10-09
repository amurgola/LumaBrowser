const PowerShellArgs = require('../../PowerShellArgs');
const SystemctlArgs = require('./SystemctlArgs');

class ServiceRequest {
  static HALTING = new Set(['stop', 'kill', 'disable', 'mask', 'freeze', 'pause', 'delete', 'remove', 'unload', 'bootout', 'configure', 'cleanup']);
  static CHANGING = new Set([
    'start', 'restart', 'try-restart', 'reload', 'force-reload', 'reload-or-restart', 'try-reload-or-restart', 'condrestart',
    'enable', 'reenable', 'unmask', 'preset', 'preset-all', 'daemon-reload', 'daemon-reexec', 'edit', 'set-property',
    'revert', 'link', 'set-default', 'isolate', 'reset-failed', 'clean', 'thaw', 'load', 'bootstrap', 'kickstart', 'submit',
    'create', 'failure', 'continue', 'run', 'config', 'sdset', 'privs', 'sidtype', 'triggerinfo', 'description', 'control',
    'setenv', 'unsetenv',
  ]);
  static SYSV_VERBS = new Set(['start', 'stop', 'restart', 'reload', 'force-reload', 'status', 'condrestart', 'try-restart']);
  static NET_VERBS = new Set(['start', 'stop', 'pause', 'continue']);
  static CMDLET_ACTIONS = Object.freeze({
    'stop-service': 'stop', 'suspend-service': 'pause', 'remove-service': 'delete', 'set-service': 'configure',
    'restart-service': 'restart', 'start-service': 'start', 'resume-service': 'continue', 'new-service': 'create',
  });
  static RC_UPDATE_ACTIONS = Object.freeze({ add: 'enable', del: 'disable', delete: 'disable' });

  static READERS = Object.freeze({
    systemctl: ServiceRequest._systemctl,
    service: ServiceRequest._sysv,
    'rc-service': (command) => ({ action: command.positionals[1], units: command.positionals.slice(0, 1) }),
    'rc-update': ServiceRequest._rcUpdate,
    launchctl: (command) => ({ action: command.positionals[0], units: command.positionals.slice(1) }),
    sc: ServiceRequest._sc,
    net: ServiceRequest._net,
    brew: ServiceRequest._brewServices,
  });

  constructor(label, action, units) {
    this.label = label;
    this.action = action || '';
    this.units = units.filter(Boolean);
    this.effect = ServiceRequest._effectOf(this.action);
    Object.freeze(this);
  }

  static parse(command) {
    const read = ServiceRequest._reader(command.name);
    const parts = read ? read(command) : null;
    if (!parts) return null;
    return new ServiceRequest(parts.label || command.display, parts.action, parts.units);
  }

  static _reader(name) {
    if (Object.hasOwn(ServiceRequest.CMDLET_ACTIONS, name)) return ServiceRequest._cmdlet;
    return Object.hasOwn(ServiceRequest.READERS, name) ? ServiceRequest.READERS[name] : null;
  }

  static _effectOf(action) {
    if (ServiceRequest.HALTING.has(action)) return 'halt';
    return ServiceRequest.CHANGING.has(action) ? 'change' : null;
  }

  static _systemctl(command) {
    const [action, ...units] = SystemctlArgs.positionals(command);
    return { action, units };
  }

  static _sysv(command) {
    const [first, second] = command.positionals;
    if (ServiceRequest.SYSV_VERBS.has(first) && second) return { action: first, units: [second] };
    return { action: second, units: [first] };
  }

  static _rcUpdate(command) {
    const [verb, unit] = command.positionals;
    return { action: Object.hasOwn(ServiceRequest.RC_UPDATE_ACTIONS, verb) ? ServiceRequest.RC_UPDATE_ACTIONS[verb] : verb, units: [unit] };
  }

  static _sc(command) {
    const words = command.positionals[0] && command.positionals[0].startsWith('\\\\') ? command.positionals.slice(1) : command.positionals;
    const [verb, unit] = words;
    return { action: verb === 'config' ? 'configure' : verb, units: [unit] };
  }

  static _net(command) {
    const [verb, ...rest] = command.positionals;
    return ServiceRequest.NET_VERBS.has(verb) ? { action: verb, units: rest } : null;
  }

  static _brewServices(command) {
    const [area, action, ...units] = command.positionals;
    return area === 'services' ? { label: 'brew services', action, units } : null;
  }

  static _cmdlet(command) {
    const named = PowerShellArgs.param(command.args, ['Name', 'DisplayName']);
    const fromParam = typeof named === 'string' ? PowerShellArgs.splitList(named) : [];
    const units = fromParam.concat(PowerShellArgs.positionals(command.args).flatMap(PowerShellArgs.splitList));
    return { action: ServiceRequest.CMDLET_ACTIONS[command.name], units };
  }
}

module.exports = ServiceRequest;
