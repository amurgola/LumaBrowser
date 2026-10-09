# FirewallControl

`core/shell/shellClassifier/rules/system/FirewallControl.js`

[HostCapability](HostCapability.md) for packet-filter changes. A change is forbidden (it can cut the machine off the network);
reads have no opinion.

Per tool:
- iptables family (`iptables`, `ip6tables`, `-legacy`/`-nft` variants, `ebtables`, `arptables`): a write command
  (`-A -D -I -R -F -X -P -N -E -Z`, case-sensitive, or the long forms). `-L`, `-S`, `-n`, `-v` read.
- `*-restore`: always writes, unless `--test`.
- `nft`: `add`, `create`, `insert`, `replace`, `delete`, `destroy`, `flush`, `reset`, `rename`, `import`, `-f`,
  `-i`; `-c`/`--check` makes it a dry run.
- `ufw`: anything but `status`, `show`, `version`, `help`, `app`; `--dry-run` reads.
- firewalld (`firewall-cmd`, `firewall-offline-cmd`): `--add-`, `--remove-`, `--set-`, `--new-`, `--delete-`,
  `--change-`, `--load-`, `--reset-`, `--panic-`, `--lockdown-`, `--policy-`, `--direct`, `--reload`,
  `--complete-reload`, `--runtime-to-permanent`.
- macOS `pfctl`: bundled letters `d e f F k K T` write; `-n` makes the call a dry run; `-s` and other value letters
  end the bundle (so `-sT` only shows tables).
- `netsh advfirewall|firewall`: anything without `show`, `dump`, `export` or `help`.
- `*-NetFirewall*` cmdlets except `Get-`.
