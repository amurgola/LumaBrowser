# RuntimeUpdateBadge

`core/llm-server/ui/js/setup-ui/runtimes/RuntimeUpdateBadge.js`

Marks an installed runtime row with what the upstream check found. A newer release puts the Update button (its tooltip names both versions) in the row's `[data-runtime-state]` slot and a neutral "Update available" badge in the head; a current build reads a muted "Up to date" instead. The action stays `install`, since an install always fetches the latest release. Rows without the slot (a runtime that is not installed) keep their Install button.

## Methods

- `apply(row, info, doc?)`: `info` is `{ current, latest, updateAvailable }`.

## Globals

None.
