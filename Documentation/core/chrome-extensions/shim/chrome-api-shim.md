# chrome-api-shim.js

`core/chrome-extensions/shim/chrome-api-shim.js`

A plain script, no dependencies, copied into an installed extension's folder
as `luma-chrome-shim.js` by [ChromeApiShim](ChromeApiShim.md) and loaded
before the extension's own code in its background (service worker or MV2
page) and its popup, options and side panel pages.

## What it does

It fills in the `chrome.*` namespaces and members Electron 43 does not
implement, and nothing else. Only missing members are added, one level deep
into plain objects (so a real `chrome.storage.local` stays and a missing
`chrome.storage.session` is added). It marks the context with
`chrome.__lumaShim` and runs once.

In a background service worker, where [shim-worker-preload.js](shim-worker-preload.md)
has exposed `globalThis.lumaShim`, two namespaces are real and the context is
marked `chrome.__lumaBridge`:

- `chrome.webNavigation`: every event is fired by the main process
  ([ChromeWebNavigation](../bridge/ChromeWebNavigation.md)); `getFrame` and
  `getAllFrames` are answered by it.
- `chrome.contextMenus`: `create` returns the id at once and sends the item
  to the main process ([ChromeContextMenus](../bridge/ChromeContextMenus.md)),
  `update`, `remove`, `removeAll` go there too, and `onClicked` fires with
  Chrome's `(info, tab)` when the user picks the item in the app's right-click
  menu. The extension's display name is sent as `bridge.hello`.

If the bridge object is present but unusable the script warns and falls back
to the stubs below.

Every stub is inert:

- Events (`onCommitted`, `onClicked`, ...) accept and remove listeners and
  never fire.
- Functions answer with an empty, well-typed value (`[]`, `null`, `false`, a
  plausible window or tab object) through a trailing callback when one is
  given, otherwise through a resolved promise, matching Chrome's dual style.
- `chrome.privacy.*` settings read as `{ value, levelOfControl:
  'not_controllable' }`.
- `chrome.storage.session`, `managed` and `sync` are in-memory areas for the
  current context with `get`/`set`/`remove`/`clear`/`getKeys` semantics.
- `chrome.runtime.connectNative` returns a port that swallows messages.
- `chrome.contextMenus.create` returns the id synchronously, as Chrome does.

Namespaces covered: webNavigation, windows, tabs (the functions Electron lacks,
such as `create`, `remove`, `captureVisibleTab`), runtime, storage,
notifications, contextMenus, privacy, permissions, commands, sidePanel,
cookies, declarativeNetRequest, userScripts, scripting, extension,
browserAction, downloads.

## Why

Bitwarden's MV3 background script throws on
`chrome.webNavigation.onCommitted` at startup, and its popup then waits forever
for a background that never answered. With the shim the background boots,
autofill-on-load and the right-click autofill menu work through the bridge,
and the features behind the stubbed APIs (window popouts, native messaging,
notifications) simply do nothing.

## storage.sync

Electron defines `chrome.storage.sync`, but every call fails with `"sync" is
not available in this instance of Chrome`; Dark Reader's background died on it
and never themed a page. The shim replaces `chrome.storage.sync` with
`chrome.storage.local`, which is where Chrome keeps sync data for a profile
that is not signed in. `storage.onChanged` reports such changes with area
`local`.
