# RegistryControl

`core/shell/shellClassifier/rules/system/RegistryControl.js`

[HostCapability](HostCapability.md) for Windows registry writes.

- Covers `reg`, `regedit`, and `*-Item`/`*-ItemProperty` cmdlets and their aliases when an argument is a registry
  path (`HKLM:`, `HKCU\`, `Registry::HKEY_*`).
- Forbidden: a machine-wide hive (HKLM, HKCR, HKU, HKCC in any spelling) or a sensitive key anywhere: `Run`,
  `RunOnce`, `RunOnceEx`, `RunServices`, `Winlogon`, `Policies`, `Services`, `Image File Execution Options`,
  `Shell Folders` (startup persistence, service config, policy, debugger hijack).
- Mass-destructive: other writes (`reg add|delete|copy|import|restore|load|unload`, every key checked, so `reg copy`
  into HKLM is caught), `regedit /s`, item cmdlets on HKCU.
- Reads (`reg query|export|save|compare`) have no opinion. Item cmdlets on file paths are left to FilesystemRule.
