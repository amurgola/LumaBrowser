# IpcSubscription

`core/shared/ipc/IpcSubscription.js`

Builds the subscribe functions preloads expose for main-to-renderer IPC
channels. Shared by [DashboardPreloadApi](../../dashboard/preload/DashboardPreloadApi.md),
[OnDemandPreloadApi](../../on-demand/preload/OnDemandPreloadApi.md) and the LLM
tab's [PreloadSection](../../llm-server/preload/PreloadSection.md).

## Methods

- `IpcSubscription.of(ipcRenderer, channel, map?)` returns `subscribe(cb)`.
  Each `subscribe` call adds ONE listener on `channel` and returns a detach that
  removes exactly that listener (not every listener on the channel). `cb`
  receives `map(event, ...args)`; the default map is
  `IpcSubscription.payload` (the first payload after the event).

## Packaging

Required by preloads: must ship as plain JS (bytecode SKIP_FILES and
asarUnpack).
