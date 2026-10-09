# RoleplayExtension

`extensions/roleplay-mode/RoleplayExtension.js`

The Roleplay Mode extension's main-process side: registers the `roleplay` chat
mode, its IPC channels and the flag-gated Roleplay Lab Setup tab, and publishes
the Lab service for the core `core.rpLab.*` IPC controller.

## Methods

- `new RoleplayExtension({ requireCore? })` (`requireCore` defaults to
  [CoreRequire](CoreRequire.md)`.require`; tests inject a fake).
- `activate(context)` registers the descriptor from
  [RoleplayModeDescriptor](mode/RoleplayModeDescriptor.md) (postProcess is a
  [RoleplayPostProcessor](pipeline/RoleplayPostProcessor.md)), registers
  [RoleplayIpcHandlers](mode/RoleplayIpcHandlers.md), applies the
  [LabFlag](mode/LabFlag.md) and sets `global.__lumaRpLabService` to a
  [LabService](lab/LabService.md) built over `context.chat.generateImage`, core
  `roleplay-lab/LabHarness` (through CoreRequire), the image server's
  `getDefaults()` and the chat router's `chatStore` ([HostGlobals](HostGlobals.md)).
  Resolves `{}`.
- `deactivate()` clears `global.__lumaRpLabService` if it is still ours. The
  chat mode is unregistered by the extension manager.
- `RoleplayExtension.LAB_SERVICE_GLOBAL` (`__lumaRpLabService`).

## Entry files

- `manifest.js`: unchanged id `roleplay-mode`, `private: true`,
  `distributable: true`, optional `core:llm-service` and `core:database`,
  `chatUi: { file: './chat-ui.js', assets: ['./roleplay.css', './rp-lab.js', './shared.js'] }`,
  `settings` tab `roleplay-mode` with `./settings.html`, `main`, `renderer`.
  Purpose header added; comments reworded.
- `main.js`: `{ activate, deactivate }` delegating to one RoleplayExtension.
- `chat-ui.js`, `rp-lab.js`, `renderer.js`, `shared.js` (the page copy):
  classic-script exceptions, see [chat-ui](chat-ui.md), [rp-lab](rp-lab.md),
  [renderer](renderer.md), [shared](shared.md). `roleplay.css` and
  `settings.html` are copied unchanged (em-dashes removed from CSS comments).
- `emotions.catalog.json`: data, copied unchanged.

## Renderer contract (for the renderer porter)

Chat events emitted by postProcess, unchanged names and payloads: `mode:world { messageId, characters, scenes, activeSceneId, currentState, newCharIds, newSceneId, sceneChanged }`, `mode:progress { messageId, label }` or `{ messageId, done: true }`, `mode:image-start { messageId }`, `mode:image-stage { messageId, stage, b64, mime }`, `mode:image { messageId, b64, mime }`, `mode:image-fail { messageId, canceled? }`, `mode:scene-art { sceneId, b64, mime }`. The Lab adds `lab:step` (LabHarness) and `lab:comparison { composite, integrated }` on `core.rpLab.event`. IPC: `ext.roleplay-mode.getLabFlag` / `setLabFlag(on)` -> `{ enabled }`, and the four debug channels (see RoleplayIpcHandlers). The setup tab is `{ id: 'roleplay-lab', label: 'Roleplay Lab', file: './rp-lab.js' }`.
