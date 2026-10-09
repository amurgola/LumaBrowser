# MusicRuntimeMarkup

`core/llm-server/ui/js/music-setup/MusicRuntimeMarkup.js`

Markup for the Music Runtime card: name, version and status rows, hardware / WSL2 / GPU-in-WSL pills, the install progress, the "Rebuild needed" notice, and Install, Update to X, Reinstall, Cancel, Check for updates, Uninstall and Stop server.

## Methods

- `html(row, progress, running)`; `pill(state, installed)`; `isStaleBuild(row)` (a managed install from a different source pin or an older `envRevision` than the catalog carries).

## Globals

None.
