# CriticalServices

`core/shell/shellClassifier/rules/system/CriticalServices.js`

Services whose loss locks the user out, cuts the network, ends the session or drops the machine's defenses.

## Methods

- `CriticalServices.consequenceOf(name)`: the consequence sentence for a critical service, or `null`.
- `CriticalServices.canonical(name)`: strips a launchd domain (`gui/501/`, `system/`), a unit-file or plist
  directory, a `.service`, `.socket` or `.plist` suffix, a systemd template instance (`@...`) and a reverse-DNS
  label prefix (`com.openssh.sshd` to `sshd`); lowercases. Names with spaces (Windows display names) are kept whole.
- `CriticalServices.GROUPS`: `{ consequence, names }`: remote access (ssh, sshd, winrm, termservice, lanmanserver,
  screensharing, tailscaled), networking (NetworkManager, systemd-networkd/-resolved, wpa_supplicant, dhcpcd, Dhcp,
  Dnscache, NSI, netprofm, WlanSvc, configd, mDNSResponder), the login session (dbus, systemd-logind, polkit,
  display managers, loginwindow, WindowServer, RpcSs, EventLog), defenses (firewalld, ufw, apparmor, auditd, MpsSvc,
  WinDefend, wscsvc, wuauserv).

## Why

Grouped by consequence so the reason tells the user what they would lose. `.socket` counts: on socket-activated
systems stopping `sshd.socket` is what closes port 22. Docker is not listed: stopping it stops containers but does
not cut access to the machine, so it asks instead.
