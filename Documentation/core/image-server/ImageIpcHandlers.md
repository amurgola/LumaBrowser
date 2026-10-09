# ImageIpcHandlers

`core/image-server/ImageIpcHandlers.js`

IPC controller for the image server (`core.imageServer.*`). Routes only; the work
lives in the services under [ipc/](ipc/) and in [ImageRouter](ImageRouter.md).

## Methods

- `ImageIpcHandlers.register(service, { notify })` registers the 48 channels below
  on `ipcMain`, wires [ImageServerBroadcast](ipc/ImageServerBroadcast.md) to
  `service.runtimeServer`, and returns `{ router }` (the ImageRouter the chat agent
  bridge shares, one queue and one abort). `service` is the ImageServerService.

Every handler is `IpcEnvelope.enveloped` (`{ success: true, ... }`, or
`{ success: false, error, ...fields }` on a throw; a service result that already
carries `success` passes through) except the four raw ones, which the renderer
reads as bare values: `getEnabled`, `getDefaults`, `isRoleReady` (false when the
check throws) and `getServerStatus`.

| Channel(s) | Routed to |
|---|---|
| `getEnabled`, `setEnabled` | `service.isEnabled`, `service.setEnabled` |
| `getModelsView`, `setModelsDir`, `setModelKind`, `modelCatalog` | [ImageModelsView](ipc/ImageModelsView.md) |
| `pickModelsDir`, `pickLibraryDir` | `PathPicker.pick` -> `{ canceled }` or `{ canceled: false, dir }` |
| `getModelDisplayNames`, `setModelDisplayName` | `{ names }` from the service |
| `getRuntimesView`, `checkRuntimeUpdates`, `locateRuntime`, `registerRuntimeBinary`, `installRuntime`, `uninstallRuntime` | [ImageRuntimeSetup](ipc/ImageRuntimeSetup.md); install progress on `core.imageServer.runtimeEvent` `{ id, type, payload }` |
| `getAutoUnloadMs`, `setAutoUnloadMs` | `{ ms }` from the service |
| `setDefaults` | [ImageDefaultsUpdater](ipc/ImageDefaultsUpdater.md) |
| `getRamPinStatus` | `{ status: service.ramPin.getStatus() }` |
| `getServerConfigs`, `setActiveServer` | [ImageServerConfigs](ipc/ImageServerConfigs.md) |
| `saveRemoteServers`, `removeRemoteServer`, `setRemoteServerModel` | the service (`{ servers }` / its own result) |
| `getServerStatus`, `stopServer` | [ImageSlots](ipc/ImageSlots.md) `status`, `stopAll` (`{ status }`) |
| `startServer` | `service.startServerResolved()` |
| `cancelModelDownload` | [ImageDownloadSlot](ipc/ImageDownloadSlot.md) `cancel` |
| `downloadModel` | [CatalogModelInstaller](ipc/CatalogModelInstaller.md) |
| `removeInstalledModel` | [InstalledModelRemover](ipc/InstalledModelRemover.md) |
| `updateModelFile` | [ModelFileUpdater](ipc/ModelFileUpdater.md) |
| `listLoras`, `importLora`, `loraCatalog`, `downloadLora` | [ImageLoraLibrary](ipc/ImageLoraLibrary.md) |
| `setModelLoras` | [ModelLoraAttacher](ipc/ModelLoraAttacher.md) |
| `getPromptProfiles`, `pickImportFile`, `importModelFromUrl`, `importModelFromRepo`, `importModelFromFile` | [ImageModelImporter](ipc/ImageModelImporter.md) |
| `scanExistingLibraries`, `importExistingModel` | [ExistingModelAdopter](ipc/ExistingModelAdopter.md) |
| `generate`, `generateAbort` | [ImageGenerationRequests](ipc/ImageGenerationRequests.md); events on `core.imageServer.imageEvent` `{ requestId, type, payload }` |

Download, import and LoRA progress goes to the calling renderer on
`core.imageServer.modelEvent` `{ type, payload }` through `SenderStream`. All
model, LoRA, import and file-update downloads share one
[ImageDownloadSlot](ipc/ImageDownloadSlot.md).
