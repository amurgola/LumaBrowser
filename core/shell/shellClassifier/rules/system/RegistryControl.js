const HostCapability = require('./HostCapability');

class RegistryControl extends HostCapability {
  static BREAKS_REGISTRY = 'Editing machine-wide registry hives or startup keys can break Windows.';

  static REG_WRITES = new Set(['add', 'delete', 'copy', 'import', 'restore', 'load', 'unload']);
  static MACHINE_HIVE = /^(registry::)?(hklm|hkey_local_machine|hkcr|hkey_classes_root|hku|hkey_users|hkcc|hkey_current_config)(:|\\|\/|$)/;
  static REGISTRY_PATH = /^(registry::)?(hk(lm|cu|cr|u|cc)|hkey_[a-z_]+)(:|\\|\/|$)/;
  static SENSITIVE_KEYS = /\\(run|runonce|runonceex|runservices|winlogon|policies|services|image file execution options|shell folders)(\\|$)/;
  static ITEM_CMDLET = /^(remove|set|new|rename|clear|move|copy)-item(property)?$/;
  static ITEM_ALIASES = new Set(['ri', 'rm', 'del', 'erase', 'rd', 'rmdir', 'sp', 'rp', 'ni', 'mi', 'move', 'rni', 'ren', 'cli', 'clp', 'cpi', 'copy']);

  covers(command) {
    if (command.name === 'reg' || command.name === 'regedit') return true;
    return RegistryControl._isItemCommand(command.name) && RegistryControl._registryPaths(command).length > 0;
  }

  judge(command) {
    if (command.name === 'regedit') return RegistryControl._regedit(command);
    if (command.name === 'reg') return RegistryControl._reg(command);
    return RegistryControl._verdictFor(RegistryControl._registryPaths(command), `${command.display} changes the registry.`);
  }

  static _reg(command) {
    const [operation, ...rest] = command.positionals;
    if (!RegistryControl.REG_WRITES.has(operation)) return null;
    const keys = rest.filter((word) => RegistryControl.REGISTRY_PATH.test(word));
    return RegistryControl._verdictFor(keys, `reg ${operation} changes the registry.`);
  }

  static _regedit(command) {
    return command.has('/s') ? HostCapability.ask('regedit /s imports a .reg file into the registry.') : null;
  }

  static _verdictFor(keys, askReason) {
    return keys.some(RegistryControl._isProtectedKey) ? HostCapability.forbid(RegistryControl.BREAKS_REGISTRY) : HostCapability.ask(askReason);
  }

  static _isProtectedKey(key) {
    const normalized = key.replace(/\//g, '\\');
    return RegistryControl.MACHINE_HIVE.test(normalized) || RegistryControl.SENSITIVE_KEYS.test(normalized);
  }

  static _isItemCommand(name) {
    return RegistryControl.ITEM_CMDLET.test(name) || RegistryControl.ITEM_ALIASES.has(name);
  }

  static _registryPaths(command) {
    return command.lowered.map((arg) => arg.replace(/^-[a-z]+:/, '')).filter((arg) => RegistryControl.REGISTRY_PATH.test(arg));
  }
}

module.exports = RegistryControl;
