# ChatMode

`core/llm-server/ui/js/chat/ChatMode.js`

The LLM tab's chat surface, also run by the web PWA: it builds the sidebar, chat
column, artifact panel and composer into a root element over ONE injected API
object, and exposes the lifecycle other surfaces drive. Start with
[ChatSurface](ChatSurface.md) for the folder map.

## Methods

- `new ChatMode(collaborators?)` builds a [ChatContext](ChatContext.md) and every
  component in `ChatMode.COMPONENTS` (one instance each, stored on the context by
  name). Nothing touches the DOM yet.
- `setCollaborators(partial)` sets collaborators built after the chat (the code
  editor needs the chat for `addContext`, so one of the two is wired late).
- `mount(rootEl, api)` builds once (later calls only replace `api` and `root`):
  1. The shell: `.cm-sidebar` and `.cm-content` (`.cm-stage` holding `.cm-main`
     and `.cm-artifact-panel`, then `.cm-composer-bar`), a chat-scoped Resonant
     (`ResonantRuntime.scoped(root)`), then sidebar, main column, panel, file
     drop, foot alignment and the `liveAnswer` stream scalar.
  2. The sidebar's collapsed state (`api.getSidebarCollapsed`).
  3. The host subscriptions ([ChatSubscriptions](ChatSubscriptions.md)).
  4. The dev flag (`api.debug.getLogs().isDev`), the share status.
  5. The chat-extension modes (`chatExt.load(api)`; a failure never blocks).
  6. Whether the host has the documentation index (`api.docsSource.status`,
     [DocsSourceContext](composer/DocsSourceContext.md)), models,
     conversations, the thinking capability (not awaited), the landing, and a
     pending "open in this mode" intent.
- `show()` refreshes models (repainting the pill on the landing), conversations,
  and re-checks a pending intent.
- `hide()` closes popovers and the code-block bar.
- `openTrigger(id)`, `openConversation(id)`: open a trigger's runs view or a
  conversation (deep links, the trigger card's View runs, e2e helpers).
- `addContext(item, focus)`: stage editor context
  (`{ kind: 'selection'|'file', path, startLine?, endLine?, text? }`) for the
  next prompt.
- `activeConversationId()`: the open conversation's id or `null`.

## The injected API

`api` is the only way to the backend: `window.llmDiagAPI` from the tab preload
on the desktop, and the PWA's `llm-api-shim.js` (HTTP plus IndexedDB) on the
web. The chat stays transport-agnostic exactly as legacy: every optional member
is feature-detected and its affordance hidden when absent (the shim has no
`share`, `schedTasks`, `triggers`, `tabPreview`, `openAppSettings`,
`openDashboard`, `pinToDashboard`, `conv.setChoices`, `chat.agentTools`,
`chat.readWorkspaceFile`, `readDroppedAttachments`, `docsSource`, ...).

Required: `onChatEvent(cb)`, `chat2(args)`, `chatAbort()`, `listModels()`,
`getSidebarCollapsed()`, `setSidebarCollapsed(b)`, `setLastModelRef(ref)`,
`conv.list/messages/search/autotitle/rename/pin/delete/meta.get/meta.set`.
The backend contract (chat2 args and chat event types) is unchanged from legacy;
see [ChatEventRouter](stream/ChatEventRouter.md) and [TurnSender](stream/TurnSender.md).

## Collaborators

Each is optional and injected through the constructor or `setCollaborators`;
ChatMode never imports them. The wave-3 page entry wires them.

| Name | Interface used | Supplied by (wave 2) | Legacy global |
|---|---|---|---|
| `chatExt` | `load(api)` (async), `list()` -> backend mode descriptors, `getMerged(id)` -> descriptor + client hooks or null, `openSchemaInline(schema, { api, title, host })` -> data or null | `chat-ext/LumaChatExt` instance (A2) | `window.LumaChatExt` |
| `voiceFactory` | `create({ api, chat: { submit(text), abort(), isStreaming() }, onReadingChange(key, state) })` -> controller with `active`, `wireButton(btn)`, `onChatDelta(text)`, `onTurnDone()`, `onTurnError()`, `readAloud(text, key, btn)`, `stopReading()`, `readingKey`, `readingState` | `voice/VoiceController` (the class: its static `create`) (A2) | `window.LumaVoice` |
| `codeEditor` | `isDocked()`, `openPath(path)`, `insertAtCaret(text)` | `code/CodeEditor` instance (A2) | `window.LumaCodeEditor` |
| `setupNav` | `go('settings')` | the Setup view's navigator | `window.LumaSetupNav` |

The reverse direction: ModeToggle needs `{ mount, show, hide }`, CodeEditor
needs `{ addContext }`, TriggerCard needs `{ openTrigger }`: pass the ChatMode
instance itself.

Chat-mode client hooks (from `chatExt.getMerged`) are called with the context
documented in [ModeContext](modes/ModeContext.md): `preflight`, `openSetup`,
`startConversation`, `decorateComposer`, `onOpenConversation`,
`renderTurnExtras`, `onChatEvent`, `onMessageEdited`, `onRestart`,
`onLeaveConversation`, `applyTheme`.

## Window events

Dispatched: `luma-switch-mode` (`'setup'`), `luma-code-surface`
(`{ conversationId, available, root, label }`), `luma-chat-tool`
(`{ conversationId, phase, tool, params, success }`). Listened: `resize`,
`dragend`, `blur`, `keydown` (Ctrl/Cmd+K) and `click` (popover closers).

## Globals

Reads `window.Resonant` (through ResonantRuntime), `window.LumaModal` (through
Dialogs), `window.monaco` (through MonacoLoader), `window.LumaLandingSeeds` (a
page override of the starter chips). Writes none: legacy `window.LumaChatMode`,
`window.cm`, `window.liveAnswer`, `window.lumaBrowserResonant` handlers
(`cmRowOpen`, `cmRowMenu`, `cmGroupDel`, `cmSearch`, `apShare`, `apDl`, `apPop`,
`apClose`) are gone: the chat uses its own scoped Resonant and registers
handlers on it. ResonantJs itself still caches array templates on
`window['cm.visible_template']`.
