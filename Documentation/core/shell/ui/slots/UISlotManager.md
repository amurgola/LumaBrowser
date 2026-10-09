# UISlotManager

`core/shell/ui/slots/UISlotManager.js` (ES module)

The shell window's extension UI host: named slots in `index.html`
(`data-slot="..."`) that extension renderers mount into, the loader that runs
each extension's `renderer.js`, and the Settings Extensions and About tabs.
Start here; the parts are:

| Folder | Classes |
|---|---|
| `slots/` | UISlotManager, [ToolbarButton](ToolbarButton.md), [DockPanel](DockPanel.md), [ManifestUi](ManifestUi.md) |
| `extensions/` | [ExtensionRendererHost](../extensions/ExtensionRendererHost.md), [RendererScriptLoader](../extensions/RendererScriptLoader.md), [RendererGlobal](../extensions/RendererGlobal.md), [ExtensionMetaStore](../extensions/ExtensionMetaStore.md), [ExtensionInstallEvents](../extensions/ExtensionInstallEvents.md) |
| `settings/` | [SettingsScreens](../settings/SettingsScreens.md) and the panels it wires |

## Public API (for the shell entry, C1)

- `new UISlotManager({ hooks })`. `hooks` (all optional, see
  [ShellHooks](../settings/ShellHooks.md)): `toast(message, kind)` ('ok' |
  'bad', the Settings toast), `markSaved(control, ok, errorMessage)` (the
  General tab's saved badge), `closeSettings()`, `rerunSetupWizard()`. Without a
  hook the legacy window function of the same job is used if present
  (`settingsToast`, `addLogEntry`, `gsMarkSaved`, `closeSettings`,
  `__rerunSetupWizard`).
- `init()`: finds every `[data-slot]` container. Call once the DOM is ready.
- `initSettingsTabs()`: adds the Extensions and About tabs to the Settings modal
  (needs `.settings-tabs`; see [SettingsTabs](../settings/SettingsTabs.md)).
- `switchSettingsTab(tabName)`: `'general'`, `'extensions'`, `'about'` or any
  page tab (`data-tab`), as the shell's `data-gs-goto` links and menu do.
- `loadExtensions(extensionList, context)`: subscribes once to the hot-install
  broadcasts, then loads and activates every enabled, loadable renderer.
  `extensionList` is `ipcBridge.getExtensions()` (the main process's
  RendererExtensionList); `context` is the shared renderer context, legacy
  `{ electronAPI, ipcBridge, browserRenderer, slotManager }`.
- `refreshTelemetryPanel()`: re-renders Settings > About > License (legacy
  renderer.js called the private `_loadLicensePanel()` after the wizard).
- Slot methods used by extension renderers: `register(slotName, extensionId,
  content, config)`, `unregister(slotName, extensionId)`,
  `unregisterExtension(extensionId)`, `activate(slotName, extensionId)`,
  `getContainer(slotName)`, `getSlotExtensions(slotName)`, `hasContent(slotName)`,
  `toggle(slotName)`, `isVisible(slotName)`, `autoRegisterFromManifest(ext)`,
  `setCallback(slotName, extensionId, callbackName, fn)`.
- Fields `slots` (Map slot -> Map id -> `{ element, config }`), `containers`
  (Map slot -> element) and `activeExtensions` (Map slot -> id) stay public as in
  legacy.

## Slots

| Slot | Behaviour |
|---|---|
| `right-sidebar` | Tabbed: only the active extension shows; the first registered is active; unregistering the active one activates the next. |
| `right-panel`, `bottom-bar` | Toggle slots: each wrapper starts `ext-hidden` and is toggled by its toolbar button; the container is visible while any wrapper is ([DockPanel](DockPanel.md)). |
| `toolbar-button`, `toolbar-buttons-right` | Also gets a [ToolbarButton](ToolbarButton.md). |
| `settings-tab` | Not a container: the content becomes the extension's Configure page in Settings > Extensions, or, with `config.placement: 'tab'`, a top-level Settings tab of its own named `config.tabId` ([SettingsScreens](../settings/SettingsScreens.md)`.registerPage`); returns null before `initSettingsTabs()`. |

`register` wraps content (HTML string or element) in
`<div data-extension-id data-slot-content class="slot-content slot-content--<slot>">`
and returns the wrapper (null and a warning for an unknown slot).

## Extension renderer contract (add-ons and wave-2 extension ports)

1. **Global.** A renderer publishes `window.__ext_<id>` (dashes in the id become
   underscores) = `{ activate(context), deactivate?() }`. Module renderers set it
   from their entry; classic ones as before.
2. **How it loads** ([RendererScriptLoader](../extensions/RendererScriptLoader.md)):
   - bundled, no `distributable: true`: `<script type="module" src="extensions/<folder>/<renderer>">`.
     The entry (`renderer.js`) is a thin module that imports its classes from
     `./ui/` and sets the global. The global must be set by the time the module
     finishes evaluating (no top-level await before it).
   - bundled with `distributable: true`: a classic `<script src>`; the file stays
     one self-contained classic script.
   - user-installed (`userInstalled`, outside the bundled file:// origin): the
     main process returns its source (`core.shell.getExtensionRendererSource`)
     and it is injected as an inline classic script, which runs synchronously.
   - Nothing loads when the global already exists.
3. **When it loads.** Only rows with `enabled !== false`, `loadable !== false`
   (an unmet dependency means its IPC handlers do not exist) and a `renderer`.
   One failing renderer is logged and never stops the rest.
4. **Before activate.** Manifest `settings` and `navigationBar` UI is registered
   ([ManifestUi](ManifestUi.md)) and handed over as `context.containers`
   `{ panelContainer, settingsContainer }` (`{}` when none is declared).
5. **activate(context)** is awaited with `{ ...shared context, extensionId,
   extensionDir, ui, slotManager, containers }`; the object is then marked
   `__lumaActive = true`.
6. **Disable** (Settings switch, delete, update): `deactivate()` runs when present
   (object marked `__lumaDeactivated`, so re-enable may call `activate()` on it
   again); a live object without `deactivate()` is marked `__lumaStale`.
   `__lumaActive` becomes false and every slot registration and the settings
   page are removed.
7. **Re-enable**: the row is refreshed from the main process; an object that is
   still active is never activated twice (warning); a stale or never-deactivated
   one is purged (global deleted, every `script[data-ext="<id>"]` removed) and
   loaded fresh. A module reload uses `?reload=<n>` because the browser evaluates
   a module URL once per page. A failing `activate()` shows a toast; a reload
   that does not publish the global again asks for an app restart.
8. **Hot install / update / delete**: `core.shell.extensionInstalled { id }`
   refreshes the list, disables and purges a live old renderer, then enables the
   new one; `core.shell.extensionDeleted { id }` disables it and drops its row.

## Globals

Reads `window.__ext_<id>`, `window.ipcBridge` (invoke, on), `window.electronAPI`
(About and updates), `window.LumaModal` (through Dialogs), and the legacy hook
fallbacks above. Writes `window.__ext_<id>` only by deleting it on purge (the
renderers themselves set it). Dispatches the `extension-toggled` DOM event on
`document` (`{ id, enabled }`), which General settings listens for.
