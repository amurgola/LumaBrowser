# PowerControl

`core/shell/shellClassifier/rules/system/PowerControl.js`

[HostCapability](HostCapability.md) for commands that end the working session. All forbidden.

- Power programs: `shutdown`, `reboot`, `halt`, `poweroff`, `Stop-Computer`, `Restart-Computer`, `logoff`, except
  harmless forms: `/a`, `-c` (cancel), `-k` (warn only), `--wtmp-only`/`-w`, `--help`, `/?`, `-WhatIf`.
- Session enders: `init`/`telinit` 0, 6, 1, S; `systemctl` power and target verbs (poweroff, reboot, halt, kexec,
  soft-reboot, suspend, hibernate, hybrid-sleep, rescue, emergency, default, exit, switch-root) and `isolate` of a
  rescue, emergency or power target; `loginctl` power, terminate, kill and lock verbs; `launchctl reboot`;
  `pmset sleepnow`; `kexec -e`; `rundll32` lock, suspend and exit entry points.

Sources: systemd systemctl(1)/loginctl(1), sysvinit init(8), launchctl(1), pmset(1), Windows shutdown docs.
