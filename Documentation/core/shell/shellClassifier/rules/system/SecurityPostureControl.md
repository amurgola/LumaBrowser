# SecurityPostureControl

`core/shell/shellClassifier/rules/system/SecurityPostureControl.js`

[HostCapability](HostCapability.md) for changes to the machine's security posture or Windows feature set. Asks, with a
tool-specific reason.

- Always: Set-ExecutionPolicy, Set/Add/Remove-MpPreference (Defender settings and exclusions),
  Enable/Disable-WindowsOptionalFeature, Disable/Suspend-BitLocker, Set-ProcessMitigation.
- Conditional: `dism` removals and disables, `wmic` delete/call/terminate/set, `setenforce 0`, `spctl`
  `--master-disable`, `csrutil disable`, `manage-bde -off|-disable|-forcerecovery`.
