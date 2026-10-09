# Accelerators

`core/browser/Accelerators.js`

Maps a keyDown `Input` from a tab webContents to a browser action id.

## Methods

- `Accelerators.match(input, ctx)` returns the action id (`'reload'`, `'new-tab'`,
  `'select-tab-3'`, ...) or `null`. `input` is Electron's Input object
  (`{ type, key, control, alt, shift, meta }`); `ctx.loading` enables Escape as `'stop'`.
- `Accelerators.MAIN_HANDLED` is the set of actions the main process performs
  itself (reload, hard-reload, back, forward, stop, zoom-in/out/reset, devtools, print).
  They are still forwarded to the chrome so it can update its UI.
- `Accelerators.IS_MAC` selects the platform table. It is read on every call,
  so tests can flip it.
- `Accelerators.LETTER_ACTIONS` maps a primary-modifier letter or symbol to its action.

## Why

Every tab webContents (user and internal, not silent) gets a
`before-input-event` listener that calls `match`; on a hit it prevents the
default, performs any main-side action and sends `{ action, tabId }` over
`tab-view:accelerator`. The renderer owns actions that touch the chrome (new
tab, close, switch, focus URL bar, find, bookmark, history, reopen closed) and
keeps an equivalent table for keys pressed while the chrome DOM has focus, so
the two tables must change together.

The primary modifier is Cmd on macOS and Ctrl elsewhere. Ctrl+Alt never
matches outside macOS because it is AltGr on many layouts. macOS uses Cmd+[ /
Cmd+] for history and Cmd+Alt+Arrow for tab switching; Alt+D focuses the URL
bar only off macOS.
