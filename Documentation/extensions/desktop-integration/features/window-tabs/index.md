# window-tabs (feature)

`extensions/desktop-integration/features/window-tabs/index.js`

Any desktop window opened as a regular LumaBrowser tab. The tab's page plays a
live capture of the window, keeps the window's accessible text in the page (so
the chat's "ask about a tab" and the browser tools read the window like a page),
can pass clicks, keys and scrolling through to the window, and, being a plain
tab, can be shared with Tab Share (a `view` link watches the window, an
`interact` link works in it). Windows only.

Opened from:

- the shortcut hint: hold Ctrl+Alt+Shift, click a window, press T ("Open as
  tab"; "Show tab" once it has one);
- the shortcut `Ctrl+Alt+Shift+T` on the window in front;
- REST (below) or the page's own picker ("Another window").

Descriptor: `id: 'window-tabs'`, `label: 'Window tabs'`, `defaultEnabled: true`,
`settingsSchema` from [WindowTabsFeature](WindowTabsFeature.md)
(`binding`, `control`, `textRefreshSec`, `frameRate`), `create(deps)` builds the
feature with its real parts and starts it.

## REST (`/api/desktop/window-tabs`)

- `GET /` -> `{ success, platform, supported, binding, registered, conflict, control: { allowed, reason }, tabs: [{ hwnd, tabId, app, exe, title, alive }] }`.
- `POST /open { hwnd? }` -> opens that window (its owner for a dialog) or the
  window in front as a tab, or shows the tab it already has:
  `{ success, hwnd, tabId, created }`. 404 for no window, 422 for Luma's own
  windows and the shell, 501 off Windows.
- `POST /close { hwnd }` -> closes the window's tab.

## Files

- [WindowTabsFeature](WindowTabsFeature.md): the wiring.
- [WindowTabInput](WindowTabInput.md): input passed through to the window.
- [ui/window-tab](ui/window-tab.md): the page; [ui/preload](ui/preload.md): its bridge.
