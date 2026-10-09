# SavedBadge

`extensions/ui-kit/ui/SavedBadge.js`

Flashes an inline "Saved" badge next to a control after an autosave.

## Methods

- `SavedBadge.flash(anchor, text = 'Saved')`: reuses the `.luma-saved` element
  right after `anchor` or creates it (check icon plus text), sets the text, adds
  `is-on` and removes it after `VISIBLE_MS` (1.6 s); a new flash restarts the
  timer. The badge stays in the DOM so the row never reflows. Does nothing
  without an anchor.

## Globals

Reads `document`.
