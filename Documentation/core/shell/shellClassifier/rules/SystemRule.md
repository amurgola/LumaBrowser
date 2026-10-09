# SystemRule

`core/shell/shellClassifier/rules/SystemRule.js`

[ShellRule](../ShellRule.md) for host-control commands, organized as capabilities.

## Methods

- `rule.assess({ name, args, dialect })`: builds a [HostCommand](HostCommand.md); the first capability that covers
  it judges it (forbidden, mass-destructive or `null`).
- `SystemRule.capabilityFor(command)`: the covering capability, or `null`.
- `SystemRule.CAPABILITIES`, in order ([HostCapability](system/HostCapability.md) subclasses):
  [PowerControl](system/PowerControl.md), [FirewallControl](system/FirewallControl.md),
  [NetworkLinkControl](system/NetworkLinkControl.md), [RegistryControl](system/RegistryControl.md),
  [ServiceControl](system/ServiceControl.md), [ProcessControl](system/ProcessControl.md),
  [PackageControl](system/PackageControl.md), [AccountControl](system/AccountControl.md),
  [ScheduleControl](system/ScheduleControl.md), [KernelControl](system/KernelControl.md),
  [SecurityPostureControl](system/SecurityPostureControl.md).

Order matters only where names overlap: power precedes services (`systemctl reboot`), services precede packages
(`brew services`) and accounts (`net stop` vs `net user`).

## Why

Ending the session, cutting the machine off the network, removing what the OS needs or killing an OS process can
never be approved from an agent; other host changes always ask. Each capability reads its tools' own syntax from
their manuals (systemctl, launchctl, sc.exe, iptables, nft, ufw, firewalld, pfctl, netsh, apt, dnf, pacman, zypper,
apk, brew, winget, choco), so read-only forms pass. A service call with no unit (`systemctl status`) never throws,
so one such call cannot hide a forbidden command elsewhere on the line.
