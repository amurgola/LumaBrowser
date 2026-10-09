# Web client (PWA)

`core/network-sharing/webapp/public/`

The browser chat client the web backend ([WebAppServer](../WebAppServer.md))
serves at `/`, and the read-only shared conversation page it serves at
`/share/<token>`. Any device on the network opens the URL, pairs with the
host's PIN, and runs the REAL desktop chat surface
([ChatMode](../../../llm-server/ui/js/chat/ChatMode.md)) over an HTTP-backed
`llmDiagAPI`. Conversations live on the device (IndexedDB); the host is a
stateless inference backend. Native ES modules, one class per file.

## Pages

| Page | Served at | Entry | Styles |
|---|---|---|---|
| `index.html` | `/` (and the SPA fallback) | `js/web/entry.js` after the classic `/llm-ui/luma-modal.js` and `/llm-ui/resonant.js` | `/llm-ui/css/{base,chat,live-module,luma-components}.css`, `web-overrides.css`, `pair.css` |
| `share-view.html` | `/share/<token>` ([ShareRouter](../ShareRouter.md)) | `/js/share/entry.js` | `/llm-ui/css/base.css`, `/llm-ui/css/chat.css`, `/share-view.css` (was its inline `<style>`) |

`share-view.html` uses absolute URLs because it is served under `/share/<token>`.
The LLM tab's PDF/PNG export inlines the same page
([ConversationExportHtml](../../../llm-server/chat/ConversationExportHtml.md)).

## Import maps

Modules import the shared chat code by file path (`../../../../../llm-server/ui/...`),
which the browser resolves to `/llm-server/ui/...`; the host serves that tree at
`/llm-ui/`. Agent-manager's chat bundle, loaded from `/sharing/agents/chat-ui.js`,
imports `../../../core/llm-server/ui/...`, which resolves to `/core/llm-server/ui/...`.
So:

- `index.html`: `{ "/llm-server/ui/": "/llm-ui/", "/core/llm-server/ui/": "/llm-ui/" }`
- `share-view.html`: `{ "/llm-server/ui/": "/llm-ui/" }`

## Folders

| Folder | Classes |
|---|---|
| `js/transport/` | [LumaApi](js/transport/LumaApi.md), [PairingToken](js/transport/PairingToken.md), [HostHttp](js/transport/HostHttp.md), [Unauthorized](js/transport/Unauthorized.md), [HostApi](js/transport/HostApi.md), [ChatStream](js/transport/ChatStream.md), [ImageStream](js/transport/ImageStream.md), [VoiceApi](js/transport/VoiceApi.md), [StreamFrames](js/transport/StreamFrames.md) |
| `js/store/` | [LumaStore](js/store/LumaStore.md), [IndexedDbRepository](js/store/IndexedDbRepository.md), [ConversationStore](js/store/ConversationStore.md), [MessageStore](js/store/MessageStore.md), [ArtifactStore](js/store/ArtifactStore.md), [StoreRecords](js/store/StoreRecords.md) |
| `js/shim/` | [LlmApiShim](js/shim/LlmApiShim.md), [ChatTurnRunner](js/shim/ChatTurnRunner.md), [TurnRecorder](js/shim/TurnRecorder.md), [ShimModels](js/shim/ShimModels.md), [ShimConversations](js/shim/ShimConversations.md), [ShimArtifacts](js/shim/ShimArtifacts.md), [ShimArtifactData](js/shim/ShimArtifactData.md), [ShimVoice](js/shim/ShimVoice.md), [AttachmentReader](js/shim/AttachmentReader.md), [HostThinking](js/shim/HostThinking.md), [LocalPrefs](js/shim/LocalPrefs.md), [SingleListener](js/shim/SingleListener.md), [ArtifactViewUrl](js/shim/ArtifactViewUrl.md) |
| `js/web/` | [entry](js/web/entry.md), [WebApp](js/web/WebApp.md), [PairingGate](js/web/PairingGate.md), [MobileModelInfo](js/web/MobileModelInfo.md), [ServiceWorkerRegistrar](js/web/ServiceWorkerRegistrar.md) |
| `js/share/` | [entry](js/share/entry.md), [ShareView](js/share/ShareView.md), [ShareTurnView](js/share/ShareTurnView.md), [ShareArtifacts](js/share/ShareArtifacts.md) |
| (root) | [sw.js](sw.md) (classic-script exception), `manifest.webmanifest`, `icon.png`, `robots.txt` |

## Globals

Written (contracts other code reads): `window.LumaAPI` (agent-manager's
AgentDirectory lists agents through it), `window.llmDiagAPI` (the chat-extension
registry's default api and the bundles' contract), `window.LumaChatMode` (e2e
helpers), `window.LumaChatExt` (installed by `LumaChatExt.install`). Read:
`window.Resonant` (classic vendor script), `window.LumaModal` (classic
`luma-modal.js`), `window.__LUMA_EXPORT__` (share viewer, export mode),
`localStorage`, `indexedDB`, `fetch`, `navigator`, `matchMedia`. Legacy
`window.LumaStore` is gone: the shim gets the store injected.

## Sharing auth (unchanged)

The client sends the pairing token as a bearer on every `/sharing` call and
mirrors it into the `luma_share_token` cookie (`SameSite=Strict`) for browser
loads that cannot carry a header (artifact iframes, the agent-chat module
scripts). The shim exposes exactly the legacy key set (a test pins it); voice
setup actions answer `HOST_ONLY`.
