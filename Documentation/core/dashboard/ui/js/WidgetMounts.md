# WidgetMounts

`core/dashboard/ui/js/WidgetMounts.js`

Mounts each placed widget: a live module, always the chain's LATEST version,
through the shared plumbing the chat uses, so a widget and its chat twin share
one store; or an extension widget through its imported module.

## Methods

- `new WidgetMounts({ api, doc, catalog, cards, refreshDock })`.
- `mount(rootId, card)`: for an extension entry (`catalog.isExtension`),
  [ExtensionWidgetMount](ExtensionWidgetMount.md)`.mount(root, meta, api)` with
  no artifact fetch, remembered as `{ kind: 'extension', dispose }`. Otherwise
  fetches the dock's latest version id (falls back to
  the root row); a missing or non-`live` artifact turns the card into a
  tombstone. Otherwise sets the title, creates an
  [ArtifactDataStore](../../../llm-server/ui/js/artifacts/ArtifactDataStore.md)
  over IPC (none when `LiveModuleSource.declaresOwnStore(js)`), a
  [LumaBridge](../../../llm-server/ui/js/live/LumaBridge.md) over
  `api.liveApi`, and calls [LiveModuleMounter](../../../llm-server/ui/js/live/LiveModuleMounter.md).
  Unparseable or non-object content mounts as `{}`.
- `dispose(rootId)` releases the live store or runs the extension widget's
  teardown; `isMounted(rootId)`.
- `remount(rootId, card)` (card Reload): dispose, refresh the dock, mount afresh.
- `remountStale()`: refresh the dock and remount only live cards whose mounted
  version differs from the chain's latest (a chat edit makes a new version);
  extension widgets have no versions and are left alone.
