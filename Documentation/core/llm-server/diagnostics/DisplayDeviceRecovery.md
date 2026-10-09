# DisplayDeviceRecovery

`core/llm-server/diagnostics/DisplayDeviceRecovery.js`

Recovers a faulted Windows display adapter: the automated "disable then enable
in Device Manager", escalating to the card's PCIe parent port when the device
has dropped off the bus (a device that is not present cannot be restarted,
which is the "Generic failure" the plain approach hit).

## Methods

- `DisplayDeviceRecovery.recover(instanceId)` resolves
  `{ success: true, method, message }` or `{ success: false, error }`.
  1. Input: Windows only; the id must match `INSTANCE_ID` (letters, digits,
     backslash, `& . _ { } -`, 4 to 512 chars) and contain a backslash, so
     nothing else is ever interpolated into PowerShell.
  2. Target: the id must be a current Display-class device
     ([PnpDisplayDevices](PnpDisplayDevices.md)) and not a software adapter,
     so this IPC cannot be used to bounce arbitrary hardware.
  3. Runs the [DisplayRecoveryScripts](DisplayRecoveryScripts.md) launcher with
     a 3 minute timeout (UAC dialog plus several restarts and settle sleeps),
     reads the verdict file from the temp dir, then deletes it.
- `DisplayDeviceRecovery.interpret(result, verdict)` the reply rules: a failed
  launch reports the stderr (a dismissed UAC prompt becomes `Administrator
  approval was cancelled, so the device was not restarted.`); otherwise the
  verdict decides, and the `EXITCODE=` line only when the file was unreadable.

Restarting the parent briefly takes down everything behind that PCIe port; for
an M.2-mounted GPU that is just the card.
