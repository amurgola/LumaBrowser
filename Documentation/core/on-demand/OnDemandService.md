# OnDemandService

`core/on-demand/OnDemandService.js`

Owns the per-tab conversations behind Luma On Demand's floating Live panel. Each
browser tab gets at most one hidden conversation in the `on-demand` chat mode,
carrying the page context, scoped to the session.

## Methods

- `new OnDemandService({ getRouter, getTabInfo?, chatModeRegistry?, modeId?, log? })`.
  `getRouter()` returns the UnifiedChatRouter (`chatStore`, `chat`, `abort`,
  `listModels`); `getTabInfo(tabId)` returns `{ url, title }`. Throws without `getRouter`.
- `isReady()` is true once the router has a chat store.
- `modeLoaded()` is true when the registry knows the mode (an absent registry is
  trusted; a throwing one counts as missing).
- `currentModelRef()` / `currentModelLabel()` read the LLM tab's selected model
  (label prefers `displayName`, then `label`, then the ref).
- `trackedConversation(tabId)` returns the tab's tracked conversation id or
  `null`, without creating or verifying it.
- `conversationFor(tabId, { create = true })` returns the tab's conversation id,
  creating the hidden mode conversation (title `On Demand: <title|host|this page>`,
  max 60 chars) with `{ mode, data: { tabId, url, title } }` meta on first use.
  A row deleted behind the service's back is recreated. `null` when not ready.
- `refreshTab(tabId)` rewrites the meta page context and title after a navigation.
- `send({ tabId, text, send, spoken })` runs one agentic turn
  (`agent`, `tools`, `noThink`, `choicesEnabled: false`, `voice` when spoken)
  with prior non-error history plus the new message. Refusals:
  `The chat backend is not ready yet.`, `Nothing to send.`, `MODE_MISSING`, `NO_MODEL`.
- `abort()` aborts the router's turn.
- `history(tabId)` returns user and assistant text only (`{ role, content, error }`).
- `tabsFor(convId)` lists tabs sharing a conversation.
- `adoptTab(newTabId, openerTabId)` lets a tab the page opened join the opener's
  conversation.
- `onTabClosed(tabId)` deletes the conversation once no tab holds it, notifying
  the mode registry.
- `sweep()` deletes on-demand rows left over from an earlier run.
- `dispose()` drops every live conversation.
- `OnDemandService.MODE_ID` is `'on-demand'`.

## Why

- The mode meta carries the tab id and page context, which the mode's
  `buildTurn` turns into the system prompt and the `workTabId` pin, so the agent
  acts on the page the user is looking at instead of opening a working tab.
- Without the mode descriptor (the extension is discovered at boot, so a fresh
  install needs a restart) the router would run a plain agent turn with no page
  prompt and a lazy working tab beside the user's page; the service refuses
  instead of acting on the wrong tab.
- History is sent in the messages array because the agent bridge reads it from
  there, exactly as the chat page's `buildContext()` sends it.
- `noThink`: a live assistant should not spend time on hidden reasoning while
  the user waits.
- A page that opens a new tab ("Buy now" in a fresh tab) keeps its conversation:
  both tabs share the row, and the next turn from either pins the agent to that tab.
- No Electron here; the overlay supplies the router, registry and tab lookup, so
  this is unit-tested with fakes.
