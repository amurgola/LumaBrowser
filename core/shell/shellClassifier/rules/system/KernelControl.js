const HostCapability = require('./HostCapability');
const SystemPaths = require('../../SystemPaths');
const RawDevicePath = require('../../hostPaths/RawDevicePath');

class KernelControl extends HostCapability {
  static MOUNT_VALUE_OPTIONS = ['-o', '--options', '-t', '--types', '-L', '--label', '-U', '--uuid', '-O', '--test-opts', '-N', '--namespace'];
  static MODULE_TOOLS = new Set(['insmod', 'rmmod', 'modprobe', 'kextload', 'kextunload', 'kmutil']);
  static MODULE_READS = ['-c', '--showconfig', '-n', '--dry-run', '--show-depends', '-d'];
  static KMUTIL_WRITES = new Set(['load', 'unload', 'install', 'create']);

  static JUDGES = Object.freeze({
    mount: (command) => KernelControl._mountOnProtected(command, KernelControl._mountPoints(command, 'mount')),
    umount: KernelControl._unmount,
    swapoff: (command) => (command.has('-a', '--all') ? HostCapability.ask('swapoff -a can run the machine out of memory.') : null),
    sysctl: KernelControl._sysctl,
  });

  covers(command) {
    return Object.hasOwn(KernelControl.JUDGES, command.name) || KernelControl.MODULE_TOOLS.has(command.name);
  }

  judge(command) {
    if (KernelControl.MODULE_TOOLS.has(command.name)) return KernelControl._modules(command);
    return KernelControl.JUDGES[command.name](command);
  }

  static _unmount(command) {
    if (command.has('-a', '--all')) return HostCapability.forbid('umount -a unmounts every filesystem, including the system ones.');
    return KernelControl._mountOnProtected(command, KernelControl._mountPoints(command, 'umount'));
  }

  static _mountPoints(command, tool) {
    const words = command.positionalsSkipping(KernelControl.MOUNT_VALUE_OPTIONS).filter((word) => !RawDevicePath.is(word));
    return tool === 'mount' ? words.slice(-1) : words;
  }

  static _mountOnProtected(command, places) {
    const finding = places.map(SystemPaths.classify).find(Boolean);
    return finding ? HostCapability.forbid(`${command.display} on a protected location (${finding.reason}) can break the running OS.`) : null;
  }

  static _sysctl(command) {
    const writes = command.has('-w', '--write', '-p', '--load', '--system') || command.positionals.some((word) => word.includes('='));
    return writes ? HostCapability.ask(`${command.display} changes live kernel settings.`) : null;
  }

  static _modules(command) {
    if (command.name === 'kmutil' && !KernelControl.KMUTIL_WRITES.has(command.positionals[0])) return null;
    if (command.has(...KernelControl.MODULE_READS) || (!command.positionals.length && !command.has('-r', '--remove'))) return null;
    return HostCapability.ask(`${command.display} changes the kernel's loaded modules.`);
  }
}

module.exports = KernelControl;
