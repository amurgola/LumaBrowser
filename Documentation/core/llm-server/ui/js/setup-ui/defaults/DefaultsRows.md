# DefaultsRows

`core/llm-server/ui/js/setup-ui/defaults/DefaultsRows.js`

Row builders of the Defaults card with a "?" help toggle whose open state survives re-renders.

## Methods

- `select(id, label, options, help, attrs?)`, `text(id, label, value, placeholder, help)`, `segmented(id, label, options, current, help)` ([SegmentedPicker](../../setup/SegmentedPicker.md)), `toggle(id, label, checked, caption, help)`, `action(id, label, controlHtml, help)` (a row whose control is a button rather than a saved field), `isHelpOpen(id)`, `handleClick(target, doc)`.

## Globals

None.

## Changes (2026-11-22, framework refactor)

`segmented(..., controlAttrs)` and `toggle(..., controlAttrs)` take attributes for the control (the hidden input of a segmented picker, the checkbox); the Frameworks card tags its options with `data-fw-option` this way. One instance is shared as `ctx.rows`, so the click router's help toggles keep their open state in both cards.
