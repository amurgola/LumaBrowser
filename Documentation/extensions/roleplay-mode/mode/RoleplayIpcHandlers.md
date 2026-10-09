# RoleplayIpcHandlers

`extensions/roleplay-mode/mode/RoleplayIpcHandlers.js`

Routes the extension's IPC (`ext.roleplay-mode.*`).

## Methods

- `new RoleplayIpcHandlers(ipc, debug, labFlag)`; `register()` handles
  `debugReaction`, `debugOutfit`, `debugStaging`, `debugAudit`, `getLabFlag`,
  `setLabFlag`. No-op without `ipc.handle`.
