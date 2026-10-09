# RuntimeActions

`core/llm-server/ui/js/setup-ui/runtimes/RuntimeActions.js`

What a runtime row's buttons do.

## Methods

- `trigger(action, id, url)`: `open-external` / `open-releases` (preload `openExternal`, else `window.open`), `register-binary`, `clear-binary`, `install` (the [RuntimeInstallModal](../../setup/RuntimeInstallModal.md) chooser, skipped for extension runtimes; "auto" clears a manual registration first), `install-prerelease` ([PrereleaseInstall](PrereleaseInstall.md)), `relocate`, `uninstall`. Changes repaint the runtimes and Defaults cards.
- `autoInstall(id, channel?)`, `locate(id)`, `clearManualShadow(runtime, id)`.

## Globals

Reads `window.open`; dialogs through [Dialogs](../../dialogs/Dialogs.md).
