const HostCapability = require('./HostCapability');

class SecurityPostureControl extends HostCapability {
  static ALWAYS_CHANGES = new Set([
    'set-executionpolicy', 'set-mppreference', 'add-mppreference', 'remove-mppreference', 'disable-windowsoptionalfeature',
    'enable-windowsoptionalfeature', 'disable-bitlocker', 'suspend-bitlocker', 'set-processmitigation',
  ]);
  static DISM_CHANGES = ['/disable-feature', '/remove-package', '/remove-capability', '/remove-provisionedappxpackage', '/remove-driver'];

  static CHANGES = Object.freeze({
    dism: (command) => (command.hasPrefix(...SecurityPostureControl.DISM_CHANGES) ? 'dism removes or disables Windows components.' : null),
    wmic: (command) => (command.has('delete', 'call', 'terminate', 'set') ? 'wmic delete/call/set changes system objects.' : null),
    setenforce: (command) => (command.has('0', 'permissive') ? 'setenforce 0 turns off SELinux enforcement.' : null),
    spctl: (command) => (command.has('--master-disable', '--global-disable', '--disable') ? 'spctl --master-disable turns off Gatekeeper.' : null),
    csrutil: (command) => (command.has('disable') ? 'csrutil disable turns off System Integrity Protection.' : null),
    'manage-bde': (command) => (command.has('-off', '-disable', '-forcerecovery') ? 'manage-bde turns off or suspends BitLocker.' : null),
  });

  covers(command) {
    return SecurityPostureControl.ALWAYS_CHANGES.has(command.name) || Object.hasOwn(SecurityPostureControl.CHANGES, command.name);
  }

  judge(command) {
    if (SecurityPostureControl.ALWAYS_CHANGES.has(command.name)) return HostCapability.ask(`${command.display} changes machine security or feature state.`);
    return HostCapability.ask(SecurityPostureControl.CHANGES[command.name](command));
  }
}

module.exports = SecurityPostureControl;
