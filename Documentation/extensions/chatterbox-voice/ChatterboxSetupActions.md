# ChatterboxSetupActions

`extensions/chatterbox-voice/ChatterboxSetupActions.js`

Routes the "Voice cloning" Setup tab's `setup.invoke` actions.

## Methods

- `new ChatterboxSetupActions(host)` (host: the active [ChatterboxExtension](ChatterboxExtension.md)).
- `handle(action, payload = {})` resolves the action's result or rejects
  `Unknown action: <action>`:
  - `status` -> [ChatterboxStatus](ChatterboxStatus.md);
  - `runtime.install { id }` -> starts a [RuntimeInstallJob](RuntimeInstallJob.md),
    `{ started: true }`; one at a time (`An engine install is already running.`);
    on success the build becomes the preferred one;
  - `runtime.prefer { id }` -> saves it (null clears), stops the engine,
    `{ preferredRuntimeId }`;
  - `runtime.uninstall { id }` -> stops the engine, removes `<runtimes>/<id>`,
    clears the preference if it was this build, `{ removed: true }`;
  - `model.download { id }` -> starts a [ModelDownloadJob](ModelDownloadJob.md),
    `{ started: true }`; one at a time;
  - `model.cancel` -> `{ canceled }`;
  - `model.delete { id }` -> stops the engine, removes the GGUF, `{ removed: true }`;
  - `server.stop` -> `{ stopped: true }`;
  - `voices.*` -> [ChatterboxVoiceActions](ChatterboxVoiceActions.md).
  Unknown ids reject `Unknown engine: <id>` / `Unknown model: <id>`.
- `status()`.

## Why

The Setup tab can only request and respond, so long jobs run here and expose
progress in the polled `status` snapshot.
