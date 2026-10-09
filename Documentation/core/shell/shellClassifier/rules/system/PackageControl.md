# PackageControl

`core/shell/shellClassifier/rules/system/PackageControl.js`

[HostCapability](HostCapability.md) for operating-system package managers.

- `MANAGERS`: each manager's own removal vocabulary from its manual. Subcommands: apt/apt-get/aptitude (remove,
  purge, autoremove, autopurge, full-upgrade, dist-upgrade), dnf/yum/microdnf/tdnf (remove, erase, autoremove,
  distro-sync, swap), zypper (remove, rm, dist-upgrade, dup), apk (del), snap (remove), flatpak (uninstall), brew
  (uninstall, remove, rm, autoremove, cleanup, untap), port, winget (uninstall, remove, rm), choco, scoop. Flags:
  dpkg `-r -P`, rpm `-e`, nix-env `-e`, pacman/yay/paru `-R*` (case-sensitive: `-r` is `--root`).
- The subcommand is the first positional past the manager's value options and `key=value` words.
- Removal asks. Removing an essential package (init, kernel, libc, coreutils, shells, sudo, openssh-server, the
  package manager itself, boot loader, network stack) through a base-system manager (`guardsOs`) is forbidden.
- Installs, searches and lists have no opinion. Language package managers belong to PackagesRule.
