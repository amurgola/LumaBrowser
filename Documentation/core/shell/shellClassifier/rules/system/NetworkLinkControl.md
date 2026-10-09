# NetworkLinkControl

`core/shell/shellClassifier/rules/system/NetworkLinkControl.js`

[HostCapability](HostCapability.md) for network links and addressing.

- Forbidden (cuts the link): `ip link set ... down`, `ip <link|addr|route|rule|neigh> del|flush` (prefix object
  names like `ip a`), `ifconfig IF down`, `ifdown`, `nmcli networking off`, `nmcli radio X off`,
  `nmcli connection down|delete`, `nmcli device disconnect|delete|down`, `networksetup -remove*`, `-setv4off`,
  `-set... off`, `netsh interface|int|winsock|wlan` with `set`, `add`, `delete`, `reset` or `disconnect`,
  `Disable-NetAdapter`, `Restart-NetAdapter`, `Remove-NetIPAddress`, `Remove-NetRoute`.
- Mass-destructive (changes configuration): other `ip` add/set/change/replace, `ifconfig IF ADDR`,
  `networksetup -set*`/`-create*`, `Set|New|Rename|Enable|Reset-` NetAdapter, NetIPAddress, NetIPInterface, NetRoute,
  DnsClientServerAddress cmdlets.
- Status and lookup forms have no opinion.
