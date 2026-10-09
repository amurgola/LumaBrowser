# DisplayRecoveryScripts

`core/llm-server/diagnostics/DisplayRecoveryScripts.js`

The two PowerShell scripts behind [DisplayDeviceRecovery](DisplayDeviceRecovery.md).

## Methods

- `DisplayRecoveryScripts.elevated(instanceId, resultPath)` runs elevated and
  stops as soon as the device is Present and OK:
  1. device present: `pnputil /restart-device`, then Disable/Enable-PnpDevice;
  2. still bad or absent: its parent (the PCIe root port, via
     `DEVPKEY_Device_Parent`): `pnputil /scan-devices /instanceid`, then
     `/restart-device`, then Disable/Enable; with no parent, a global scan;
  3. a global rescan polled for up to about 21 s, for slow link retraining.

  Every step is logged; a JSON verdict `{ ok, method, message, finalStatus,
  steps }` is written to `resultPath`, and the exit code mirrors final health.
- `DisplayRecoveryScripts.launcher(elevatedScript)` runs non-elevated: starts a
  hidden `powershell.exe -Verb RunAs` (one UAC prompt) with the script as a
  UTF-16 base64 `-EncodedCommand` (no temp .ps1, no quoting hazard), waits,
  and prints `EXITCODE=<n>`.
