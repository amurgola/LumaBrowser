# ImageRuntimesCard

`core/llm-server/ui/js/image-setup/ImageRuntimesCard.js`

The Image Runtimes card: installed runtimes above a Catalogue fold (open while one of its rows installs or nothing is installed), Install, Update (only when a newer release exists) or Reinstall through [RuntimeInstallModal](../setup/RuntimeInstallModal.md) (prebuilt download or locate), Uninstall, Clear registration, Relocate, live install progress and update badges.

## Methods

- `paint()`; `onRuntimeEvent(evt)` (start, resolved, download, companion download, extract, error, finalize); `paintProgress(id)` patches one row in place; `refreshUpdateInfo()`; `locate(id)`.
- Row buttons are wired by one delegated listener on the card body, so the Update button the upstream check adds after a paint works too.
- `publishStatus()`: reports to the Image tab's [system status line](../setup-ui/system/SystemStatusStrip.md) (installing, failed, missing, an update for the runtime in use, else the chosen runtime's name) after each paint, update check and progress tick; the Image server card calls it after its own paint so the line names the chosen runtime.
- `ImageRuntimesCard.applyProgress(slot, type, payload)` folds a progress event into a slot.

## Globals

Reads `window.CSS.escape`.

## Notes

Bug H13 (kept fixed): a progress tick patches only the row's progress strip, so a row the user expanded stays expanded; a failed install keeps its message and the retry button.
