const HostCapability = require('./HostCapability');

class PackageControl extends HostCapability {
  static MANAGERS = Object.freeze([
    { names: ['apk'], guardsOs: true, verbs: ['del'] },
    { names: ['apt', 'apt-get', 'aptitude'], guardsOs: true, verbs: ['remove', 'purge', 'autoremove', 'autopurge', 'full-upgrade', 'dist-upgrade'], valueFlags: ['-o', '-t', '-c'] },
    { names: ['brew'], verbs: ['uninstall', 'remove', 'rm', 'autoremove', 'cleanup', 'untap'] },
    { names: ['choco', 'chocolatey'], verbs: ['uninstall'] },
    { names: ['dnf', 'yum', 'microdnf', 'tdnf'], guardsOs: true, verbs: ['remove', 'erase', 'autoremove', 'distro-sync', 'swap'], valueFlags: ['-c', '--repo', '--enablerepo', '--disablerepo', '--releasever', '--installroot'] },
    { names: ['dpkg'], guardsOs: true, flags: ['-r', '--remove', '-P', '--purge'] },
    { names: ['flatpak'], verbs: ['uninstall'] },
    { names: ['nix-env'], flags: ['-e', '--uninstall', '--delete-generations'] },
    { names: ['pacman', 'yay', 'paru'], guardsOs: true, flagPattern: /^(-R[a-zA-Z]*|--remove)$/ },
    { names: ['port'], verbs: ['uninstall'] },
    { names: ['rpm'], guardsOs: true, flags: ['-e', '--erase'] },
    { names: ['scoop'], verbs: ['uninstall'] },
    { names: ['snap'], verbs: ['remove'] },
    { names: ['winget'], verbs: ['uninstall', 'remove', 'rm'] },
    { names: ['zypper'], guardsOs: true, verbs: ['remove', 'rm', 'dist-upgrade', 'dup'], valueFlags: ['-r', '--repo', '-R', '--root'] },
  ]);

  static ESSENTIAL = Object.freeze([
    'systemd', 'systemd-sysv', 'init', 'linux-image*', 'linux-generic', 'linux', 'linux-lts', 'kernel', 'kernel-core',
    'glibc', 'libc6', 'libc-bin', 'musl', 'coreutils', 'bash', 'dash', 'sudo', 'openssh-server', 'apt', 'dpkg', 'rpm',
    'dnf', 'yum', 'pacman', 'apk-tools', 'alpine-base', 'busybox', 'base', 'grub*', 'shim*', 'network-manager',
    'networkmanager', 'netplan.io', 'ifupdown',
  ]);

  covers(command) {
    return PackageControl._managerOf(command) !== null;
  }

  judge(command) {
    const manager = PackageControl._managerOf(command);
    if (!PackageControl._removes(command, manager)) return null;
    const essential = PackageControl._essentialTarget(command, manager);
    if (essential) return HostCapability.forbid(`${command.display} would remove ${essential}, which the operating system needs to boot or stay reachable.`);
    return HostCapability.ask(`${command.display} removes system packages other software may depend on.`);
  }

  static _managerOf(command) {
    return PackageControl.MANAGERS.find((manager) => manager.names.includes(command.name)) || null;
  }

  static _removes(command, manager) {
    if (manager.flagPattern) return command.args.some((arg) => manager.flagPattern.test(arg));
    if (manager.flags) return command.args.some((arg) => manager.flags.includes(arg));
    return manager.verbs.includes(PackageControl._packageWords(command, manager)[0] || '');
  }

  static _essentialTarget(command, manager) {
    if (!manager.guardsOs) return null;
    const words = PackageControl._packageWords(command, manager).filter((word) => !(manager.verbs || []).includes(word));
    return words.find(PackageControl._isEssential) || null;
  }

  static _packageWords(command, manager) {
    return command.positionalsSkipping(manager.valueFlags || []).filter((word) => !word.includes('='));
  }

  static _isEssential(word) {
    const name = word.replace(/:[a-z0-9]+$/, '');
    return PackageControl.ESSENTIAL.some((entry) => (entry.endsWith('*') ? name.startsWith(entry.slice(0, -1)) : name === entry));
  }
}

module.exports = PackageControl;
