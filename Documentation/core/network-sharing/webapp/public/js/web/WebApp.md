# WebApp

`core/network-sharing/webapp/public/js/web/WebApp.js`

Builds the web chat client and publishes its page globals.

## Methods

- `WebApp.build(win = window, parts = {})`: [LumaApi](../transport/LumaApi.md),
  `LumaStore.open(win.indexedDB)`, the [LlmApiShim](../shim/LlmApiShim.md),
  `LumaChatExt.install(win)`, `ResonantTemplates.registerAll(ResonantRuntime.shared())`,
  `new ChatMode({ chatExt, voiceFactory: VoiceController })`, and the
  [PairingGate](PairingGate.md). `parts` overrides `api`, `store`, `chatApi` or
  `chatMode` (tests). Returns `{ api, store, chatApi, chatExt, chatMode, gate }`.
- `WebApp.boot(win = window, parts = {})`: `build`, then
  [MobileModelInfo](MobileModelInfo.md) on the document,
  [ServiceWorkerRegistrar](ServiceWorkerRegistrar.md), and `gate.start()`;
  resolves the built parts once the gate has decided.

ChatMode is wired the way its doc says: the chat-extension registry instance as
`chatExt` (agent-manager's "Chat with agent" bundle registers on
`window.LumaChatExt` and is loaded as a module when its descriptor says
`chatUiModule`), the VoiceController class as `voiceFactory`. No `codeEditor` or
`setupNav` on the web (the shim has no workspace, and Setup is host-only).

## Globals

Writes `window.LumaAPI` (agent-manager's AgentDirectory), `window.llmDiagAPI`
(the chat-extension registry's default api), `window.LumaChatMode` (e2e helpers);
`LumaChatExt.install` writes `window.LumaChatExt`. Reads `window.indexedDB` and
`window.Resonant` (through ResonantRuntime).
