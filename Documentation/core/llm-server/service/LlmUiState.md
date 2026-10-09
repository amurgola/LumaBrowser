# LlmUiState

`core/llm-server/service/LlmUiState.js`

The LLM tab's remembered UI state. Extends [KeyedSettings](KeyedSettings.md).

## Methods

- `new LlmUiState(settingsDb, { isConfigured })`; `isConfigured()` tells whether
  a default runtime and model are set.
- `getMode()` the stored `'setup'` or `'chat'`; with none, `'chat'` when
  configured (the user can chat at once), else `'setup'`. `setMode(mode)` an
  unknown mode clears the override; returns the resolved mode.
- `getSidebarCollapsed()`, `setSidebarCollapsed(collapsed)`.
- `getLastModelRef()`, `setLastModelRef(ref)` a modelRef string
  (`local::<stem>` or `<providerId>::<modelId>`); falsy clears.
- `setPendingSetupExpand(expand)` stores the hint, falsy clears it;
  `consumePendingSetupExpand()` returns it once, then null.
- `setChatIntent(intent)`, `takeChatIntent()` an in-memory `{ mode, data? }`
  read once (null after).
- Statics: `KEYS` (`core.llmServer.ui.mode`, `.ui.pendingSetupExpand`,
  `.ui.sidebarCollapsed`, `.chat.lastModelRef`), `MODES`.

## Why

The expand hint is persisted, not only sent live: on first run the tab is created
before the REST gateway is up, fails its load and is reloaded later, so a live
`showSetup` message sent in between is lost. The chat intent is set by an
external launcher (the Vibe button) and consumed when the chat UI next shows.
