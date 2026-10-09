# SetupExtensionTabs

`core/llm-server/ui/js/setup-ui/extensions/SetupExtensionTabs.js`

Hosts extension-contributed Setup tabs in the LLM tab. It lists the tabs from the
main process, adds a nav button, a pane and the tab's UI bundle for each, and
publishes the `window.LumaSetupExt` registry the bundles call to hand back their
`mount()`. The list is re-read when Setup comes back into view, so enabling or
disabling an extension needs no reload.

Helpers: [ExtensionTabNav](ExtensionTabNav.md) (buttons, panes, the
"Extensions" group label), [ExtensionScriptLoader](ExtensionScriptLoader.md)
(bundle injection).

## Methods

- `new SetupExtensionTabs({ api, doc?, win?, navigator? })`: `api` is
  `window.llmDiagAPI`; `navigator` is `{ go(view), flushPending() }`
  ([SetupNavigator](../nav/SetupNavigator.md)), or set later with
  `attachNavigator(navigator)`.
- `start()`: publishes `window.LumaSetupExt`, binds the live re-list hooks and
  resolves after the first `sync()`.
- `registry()`: the object published as `window.LumaSetupExt`.
- `registerTab(def)`, `show(tabId)`, `sync()`: see the contract below.
- `extensionIdFor(tabId)`: the owning extension id parsed from the bundle URL
  `/llm-ui/ext/<extensionId>/<file>`, else the tab id.

## The extension Setup-tab contract (for extension porters)

1. **Declare** the tab in `manifest.js` as `setupTab: { file, label, id? }`
   (unchanged). The main process lists it through `llmDiagAPI.setup.listTabs()`
   as `{ id, label, url, module? }`, with `url` = `/llm-ui/ext/<extensionId>/<file>`.
   Optional `icon` (an inline `<svg ...>` string; anything else falls back to a
   puzzle piece) and `description` (the button tooltip) are honoured when present.
2. **Load.** The host appends one `<script src="<url>">` per tab to `<head>`, once
   per URL, with `async = false`.
   - Bundled extensions without `distributable: true`: the tab descriptor carries
     `module: true` and the script gets `type="module"`. The entry `setup-ui.js`
     is a thin module that imports its classes from `./ui/` and registers.
   - User-installed add-ons and `distributable: true` extensions: a classic
     script, a single self-contained file (allowed exception).
3. **Register.** The bundle calls, once at load:

   ```js
   window.LumaSetupExt.registerTab({ id, mount, onShow });
   ```

   - `id`: the tab id (the manifest's `setupTab.id`, defaulting to the extension id).
   - `mount(paneEl, api)`: called once, lazily, the first time the user opens the
     tab (or immediately at registration if the user opened it before the bundle
     loaded). `paneEl` is an emptied `<div class="ext-setup-pane" id="extPane-<id>">`.
     `api` is `{ llmDiagAPI, invoke(action, payload) }`: `llmDiagAPI` is the full
     preload bridge; `invoke` resolves `llmDiagAPI.setup.invoke(extensionId,
     action, payload)`, the auth-free IPC to the owning extension's
     `context.setupTab.onInvoke` handler (it resolves `{ result }` or
     `{ success: false, error }`).
   - `onShow()` (optional): called on every show, after the mount.
   - A `mount` that throws leaves "Failed to load this tab: <message>" in the pane.
4. `window.LumaSetupExt` exists before any bundle is injected, so a bundle can
   read it synchronously at load. Its full shape is `{ registerTab(def),
   _show(tabId), refresh() }`; bundles only call `registerTab`.
5. **Removal.** When an extension disappears from the list, its button and pane
   are removed; if it was the active view the Setup surface falls back to the
   LLM view. A bundle already loaded is not unloaded (the browser cannot), and
   it is not injected again if the tab returns.

## Live re-listing

`sync()` runs at start and again on `luma-mode-changed` with detail `'setup'`,
on window `focus`, and on `visibilitychange` to visible, at most once per 3 s.
Concurrent syncs share one request. After each sync the navigator's
`flushPending()` replays a deep link that waited for its tab.

## Globals

Writes `window.LumaSetupExt` (the extension contract, identical to legacy).
Listens on `window` (`luma-mode-changed`, `focus`) and `document`
(`visibilitychange`). Reads `document` (`#pageNav`, `#setupRoot`, `<head>`).
