# LlmApiShim

`core/network-sharing/webapp/public/js/shim/LlmApiShim.js`

The web build of `window.llmDiagAPI`: the surface the transport-agnostic chat
([ChatMode](../../../../../llm-server/ui/js/chat/ChatMode.md)) consumes, built
from HTTP ([LumaApi](../transport/LumaApi.md)) plus on-device storage
([LumaStore](../store/LumaStore.md)).

## Methods

- `LlmApiShim.build({ api, store, win = window, probe = true })` returns the
  object; `probe: false` skips the model self-heal timers (tests).

## The surface (exactly legacy's keys; a test pins them)

| Key | Backed by |
|---|---|
| `chat2`, `chatAbort`, `onChatEvent` | [ChatTurnRunner](ChatTurnRunner.md), [SingleListener](SingleListener.md) |
| `voice` | [ShimVoice](ShimVoice.md) (`remote: true`) |
| `listModels`, `onServerEvent` | [ShimModels](ShimModels.md) |
| `setLastModelRef`, `getSidebarCollapsed`, `setSidebarCollapsed` | [LocalPrefs](LocalPrefs.md) |
| `conv` | [ShimConversations](ShimConversations.md) |
| `artifact`, `artifactData` | [ShimArtifacts](ShimArtifacts.md), [ShimArtifactData](ShimArtifactData.md) |
| `pickChatAttachment`, `readDroppedAttachments` | [AttachmentReader](AttachmentReader.md) |
| `chat.listModes` | `api.listChatModes()`; any failure gives `{ success: true, modes: [] }` |
| `getDefaults`, `getServerStatus` | [HostThinking](HostThinking.md) |
| `image.getEnabled/getDefaults/generate/onImageEvent` | stubs: disabled, `{}`, `{ success: false, error: 'image generation runs via Tools' }`, no-op |

Never add host reach here without the matching host route and auth: every key
is a path from a paired device into the host.

## Behaviour change

`getSidebarCollapsed()` resolves a bare boolean, as the desktop does. Legacy
resolved `{ success, collapsed }`, which the chat negates directly, so the web
sidebar always started collapsed (test in LlmApiShim.test.js).
