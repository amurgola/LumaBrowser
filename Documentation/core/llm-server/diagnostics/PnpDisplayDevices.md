# PnpDisplayDevices

`core/llm-server/diagnostics/PnpDisplayDevices.js`

Every Plug-and-Play device in the Windows Display class, including failed ones
Chromium and nvidia-smi cannot see.

## Methods

- `PnpDisplayDevices.list()` resolves raw rows `{ FriendlyName, InstanceId,
  Manufacturer, Status, Present }` or null on failure. `Status` is cast to its
  name in the script because Windows PowerShell 5.1 serialises the enum as an
  integer.
- `PnpDisplayDevices.isNonGpu(name)` true for the software adapters Windows
  always lists (Microsoft Basic Display, Remote Desktop, Hyper-V, Citrix,
  Parsec, virtual displays, spacedesk), which are never offered for recovery.
