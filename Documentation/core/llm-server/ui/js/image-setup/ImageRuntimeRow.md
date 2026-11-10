# ImageRuntimeRow

`core/llm-server/ui/js/image-setup/ImageRuntimeRow.js`

Markup for one collapsible image runtime row: status badges ("ready" needs the hardware AND an installed binary or a prebuilt asset for this host), the primary action (Install for a missing runtime; for an installed one a quiet `[data-runtime-state]` slot that [RuntimeUpdateBadge](RuntimeUpdateBadge.md) fills with Update or "Up to date"; Retry after a failed install; hidden while installing), Reinstall among the secondary actions of an installed row (not while installing), `installButton(id, label, title?)`, details with version, path and secondary actions, and the progress strip.

## Methods

- `ImageRuntimeRow.html(runtime, progress)`; `ImageRuntimeRow.badges(runtime)`.

## Globals

None.
