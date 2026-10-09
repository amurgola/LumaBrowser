# ImageRuntimesCard

`core/llm-server/ui/js/image-setup/ImageRuntimesCard.js`

The Image Runtimes card: installed runtimes above a Catalogue fold (open while one of its rows installs or nothing is installed), Install or Update through [RuntimeInstallModal](../setup/RuntimeInstallModal.md) (prebuilt download or locate), Uninstall, Clear registration, Relocate, live install progress and update badges.

## Methods

- `paint()`; `onRuntimeEvent(evt)` (start, resolved, download, companion download, extract, error, finalize); `paintProgress(id)` patches one row in place; `refreshUpdateInfo()`; `locate(id)`.
- `ImageRuntimesCard.applyProgress(slot, type, payload)` folds a progress event into a slot.

## Globals

Reads `window.CSS.escape`.

## Notes

Bug H13 (kept fixed): a progress tick patches only the row's progress strip, so a row the user expanded stays expanded; a failed install keeps its message and the retry button.
