# FirewallCommands

`core/network-sharing/FirewallCommands.js`

Pure builders for the per-platform firewall commands; nothing here executes.

## Methods

- `FirewallCommands.windowsEnsure(exePath, ruleName = RULE_NAME)` PowerShell
  that removes any prior rule of that name, then creates an inbound allow for
  the exe on the Private and Domain profiles.
- `FirewallCommands.windowsElevate(innerPs)` PowerShell that runs the inner
  script elevated, hidden, behind one UAC prompt.
- `FirewallCommands.windowsDetect(ruleName = RULE_NAME)` read-only PowerShell
  printing `{ rule, categories }` as JSON.
- `FirewallCommands.macAllow(appPath)` socketfilterfw `--add` and `--unblockapp`.
- `FirewallCommands.linuxUfw(ports)` `ufw allow <port>/tcp` for each positive
  integer port, plus `ufw allow 5353/udp`.
- `FirewallCommands.RULE_NAME`.

## Why

`New-NetFirewallRule` is used instead of netsh so a rule name with spaces
needs no fragile argv quoting. The rule name is shared verbatim with
`build/installer.nsh`; the installer and runtime must manage the same rule or
duplicates are left behind.
