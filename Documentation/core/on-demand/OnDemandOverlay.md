# OnDemandOverlay

`core/on-demand/OnDemandOverlay.js`

Luma On Demand's floating surface over the page: a small draggable tile that
opens into the Live panel. It shows only over regular web pages and runs chat
turns against the tab underneath through [OnDemandService](OnDemandService.md).
Extends `EventEmitter` (`expanded`, `collapsed`).

## Methods

- `new OnDemandOverlay(mainWindow, tabViewManager, deps)`. `deps`: `db`
  (`get`/`set` settings), `getRouter` (defaults to `global.__lumaChatRouter`),
  `chatModeRegistry?`, `tabPreviewManager?` (accepted, unused), `sttReady?`,
  `ttsReady?`, `log?`. Creates the window, registers IPC
  ([OnDemandIpc](OnDemandIpc.md)), wires tab and shell-window events, syncs.
- `isEnabled()`, `setEnabled(enabled)` (persists `core.onDemand.enabled`, folds the panel when off).
- `setExpanded(expanded)`: expanding focuses the panel; collapsing gives the
  shell window and the tab's webContents the keyboard back. Emits `expanded` or `collapsed`.
- `drag(dx, dy)` moves the tile, clamped to the page rect (no-op while hidden);
  `dragEnd()` persists `core.onDemand.pos`.
- `markReady()` marks the panel page loaded and pushes state.
- `state()` returns `{ enabled, visible, expanded, platform, pad, tab: { id, url, title } | null,
  conversationId, model, hasModel, stt, tts }`.
- `history()`, `abortTurn()` (returns `{ success: true }`),
  `sendTurn({ requestId, text, spoken })`: refuses non-page tabs with
  `Luma On Demand works on web pages only.`, streams service events to the
  panel as `on-demand:chat-event { requestId, type, payload }`, and turns a
  thrown error into an `error` event plus `{ success: false, error }`.
- `pageRect()`, `tileBounds()` (the collapsed tile rect, or `null`),
  `isOwnSender(event)`, `raiseVisible()` (no-op), `destroy()`.
- Public fields kept from legacy for the e2e test: `mainWindow`, `tvm`, `win`,
  `service`, `db`, `enabled`, `expanded`, `visible`, `ready`, `pos`.
- Statics: `ENABLED_KEY`, `POS_KEY`, `PAD` (12), `PAGE_ONLY_ERROR`, `SHELL_EVENTS`.

## Visibility rule

Enabled, the shell window visible and not minimized, the active tab a regular
web page (kind `user`, not silent or hidden), and the page area painted (a shell
modal such as Settings collapses `TabViewManager.currentBounds` to 0x0). The tile
appears with `showInactive` so it never steals the page's keyboard. Stale
on-demand conversations from an earlier run are swept the first time the chat
backend is reachable.

## Why

- Tab pages are native views painted above the shell's DOM, so anything over a
  page must be a native surface. Per-pixel transparency of a view over another
  view is unsupported on Windows (electron#45104), which would leave opaque
  corners; an owned transparent window composites through DWM and always stays
  above its parent. See [OnDemandWindowFactory](OnDemandWindowFactory.md).
- Because the window is always on top, the shell renderer is told the tile rect
  (`on-demand:tile`, sent only on change) so its notification log stacks above it.
- The tile position is stored relative to the page rect, so it survives resizes
  and side panels ([OnDemandGeometry](OnDemandGeometry.md), [OnDemandPlacement](OnDemandPlacement.md)).
- The conversation is per tab family: switching to a tab outside it folds the
  panel; a tab the page opened (`openerTabId`) is adopted into the opener's
  conversation and keeps the panel open.
- Keyboard routing is in [OnDemandKeyboard](OnDemandKeyboard.md); tab reads in
  [OnDemandTabLookup](OnDemandTabLookup.md).
