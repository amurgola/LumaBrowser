# LitePanel

`extensions/ai-chat/ui/lite-panel/LitePanel.js`

The AI Chat side panel controller over the modern chat machinery: real
ChatStore conversations through `chat2`/`chatEvent`. The router owns the
turn (tool parsing, prompting, persistence); this class owns the panel DOM, its
history list, the run zoom and the per-chat tool checklist. Turn contention is
supersede-by-design: a turn here aborts an in-flight LLM-tab turn and vice
versa.

## Methods

- `new LitePanel({ api?, tabAPI?, getActiveTabId? })`: `api` defaults to
  [ChatPanelApi](../ChatPanelApi.md)`.build(window.ipcBridge)` and throws
  "LitePanel: a chat api (window.ipcBridge) is required" without one. Installs
  [LitePanelStyles](LitePanelStyles.md), binds the panel ids, subscribes to
  `onChatEvent` and `onState`, and lists conversations (`conv.list({ limit: 50 })`).
- `checkLlmAvailability()`: `listModels`, keeps a still-listed model ref,
  else the last used (`getLastModelRef`, string or `{ ref | modelRef }`), the
  `defaultRef` or the first; fills the picker; paints `getState()` (or a
  state derived from the list when it fails). Resolves whether any model is
  listed; a throw paints an error state and resolves false.
- `destroy()`: unsubscribes and destroys the model picker.
- Public fields read elsewhere: `api` (Export All), `state`, `thread`,
  `modelRef`, `disabledTools`, `serverState`, `reqId`.

## The turn

Send (button or Enter without Shift) needs a model (one availability check
otherwise; then "No model configured. Open the LLM tab to set one up."). It
pushes the user message onto the thread and sends `chat2({ requestId:
'lite-...', conversationId?, modelRef, messages: <full thread incl. the new
message>, userMessage, agent: true, tools: true, disabledTools })`. Events for
this request run through [LiteChatReducer](LiteChatReducer.md) and are painted
on the next animation frame by [LiteThreadView](LiteThreadView.md); `done` or
`error` ends the turn (restores the composer and zoom, appends the assistant
text, autotitles a new conversation, refreshes the history). A refused or
thrown `chat2` becomes an error event. Stop calls `chatAbort()`.

## Other behaviour

- Toggle button: with `configured === false` it calls
  `openSetup({ expand: 'models' })` instead of opening; Escape closes the tools
  popover, else the confirm modal, else the panel.
- The searchable model picker filters without changing the active model.
  Picking a model stores it with `setLastModelRef`.
- Opening a conversation (not while running) shows its user and assistant
  messages and its `disabledTools`; New resets; Delete confirms through
  [LiteConfirm](LiteConfirm.md), then `conv.delete`.
- Tool checklist toggles persist with `conv.setDisabledTools` once a
  conversation exists ([LiteToolsPopover](LiteToolsPopover.md)).

## Globals

Reads `window.ipcBridge`, `window.tabAPI`, and the shell's active tab id
(`activeTabId` resolved through the global lexical scope, else
`window.activeTabId`); listens on `document` for click and keydown.
