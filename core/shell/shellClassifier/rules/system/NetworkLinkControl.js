const HostCapability = require('./HostCapability');

class NetworkLinkControl extends HostCapability {
  static CUTS_LINK = 'Network interface changes can cut the machine off the network.';

  static IP_OBJECTS = ['link', 'address', 'route', 'rule', 'neighbour'];
  static IP_CUTTING_VERBS = new Set(['del', 'delete', 'flush']);
  static IP_CHANGING_VERBS = new Set(['add', 'append', 'set', 'change', 'replace', 'del', 'delete', 'flush']);
  static NMCLI_CUTS = Object.freeze({ networking: ['off'], radio: ['off'], connection: ['down', 'delete'], device: ['disconnect', 'delete', 'down'] });
  static NETSH_LINK_CONTEXTS = new Set(['interface', 'int', 'winsock', 'wlan']);
  static NETSH_CHANGES = new Set(['set', 'add', 'delete', 'reset', 'disconnect']);
  static CUTTING_CMDLETS = new Set(['disable-netadapter', 'remove-netipaddress', 'remove-netroute', 'restart-netadapter', 'disable-netadapterbinding']);
  static CHANGING_CMDLETS = /^(set|new|rename|enable|reset)-(netadapter|netipaddress|netipinterface|netroute|dnsclientserveraddress)/;

  static EFFECTS = Object.freeze({
    ip: NetworkLinkControl._ipEffect,
    ifconfig: NetworkLinkControl._ifconfigEffect,
    ifdown: () => 'cut',
    nmcli: NetworkLinkControl._nmcliEffect,
    networksetup: NetworkLinkControl._networksetupEffect,
    netsh: NetworkLinkControl._netshEffect,
  });

  covers(command) {
    if (command.name === 'netsh') return NetworkLinkControl.NETSH_LINK_CONTEXTS.has(command.positionals[0]);
    return Object.hasOwn(NetworkLinkControl.EFFECTS, command.name)
      || NetworkLinkControl.CUTTING_CMDLETS.has(command.name)
      || NetworkLinkControl.CHANGING_CMDLETS.test(command.name);
  }

  judge(command) {
    const effect = this._effectOf(command);
    if (effect === 'cut') return HostCapability.forbid(NetworkLinkControl.CUTS_LINK);
    return effect === 'change' ? HostCapability.ask(`${command.display} changes network configuration.`) : null;
  }

  _effectOf(command) {
    if (NetworkLinkControl.CUTTING_CMDLETS.has(command.name)) return 'cut';
    if (NetworkLinkControl.CHANGING_CMDLETS.test(command.name)) return 'change';
    return NetworkLinkControl.EFFECTS[command.name](command);
  }

  static _ipEffect(command) {
    const [objectWord = '', verb = ''] = command.positionals;
    const object = NetworkLinkControl.IP_OBJECTS.find((name) => objectWord && name.startsWith(objectWord));
    if (!object || !NetworkLinkControl.IP_CHANGING_VERBS.has(verb)) return null;
    const downs = object === 'link' && verb === 'set' && command.positionals.includes('down');
    return downs || NetworkLinkControl.IP_CUTTING_VERBS.has(verb) ? 'cut' : 'change';
  }

  static _ifconfigEffect(command) {
    if (command.positionals.includes('down')) return 'cut';
    return command.positionals.length > 1 ? 'change' : null;
  }

  static _nmcliEffect(command) {
    const [area = '', verb, third] = command.positionals;
    const key = Object.keys(NetworkLinkControl.NMCLI_CUTS).find((name) => area && name.startsWith(area));
    if (!key) return null;
    const action = key === 'radio' ? third : verb;
    return NetworkLinkControl.NMCLI_CUTS[key].includes(action) ? 'cut' : null;
  }

  static _networksetupEffect(command) {
    const [option = ''] = command.lowered;
    if (option.startsWith('-remove') || /^-setv[46]off$/.test(option) || (option.startsWith('-set') && command.has('off'))) return 'cut';
    return option.startsWith('-set') || option.startsWith('-create') ? 'change' : null;
  }

  static _netshEffect(command) {
    return command.positionals.slice(1).some((word) => NetworkLinkControl.NETSH_CHANGES.has(word)) ? 'cut' : null;
  }
}

module.exports = NetworkLinkControl;
