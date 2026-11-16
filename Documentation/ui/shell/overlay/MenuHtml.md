# MenuHtml

`ui/shell/overlay/MenuHtml.js`

Popup menu markup and the extra overlay CSS (hints, checks, disabled rows, the downloads list). Each label sits in
`.bd-menu-label` (one line, ellipsised) so long page titles never wrap over the next row. Hints and check
labels are 11px `--text-muted`, right-aligned; the rules read the shared tokens the overlay page links.

Items: `{ action, label, sub?, hint?, check?, checkLabel?, danger?, disabled?, icon? }`, `{ sep: true }` or
`{ heading }`. `sub` adds a quiet second line under the label on a taller row (`.bd-two-line`, `.bd-menu-text`,
`.bd-menu-sub`); `heading` is a section label (`.bd-menu-heading`) that takes no keyboard index. Their rules
live in the overlay's `css/overlay-menus.css`.

## Methods

- `MenuHtml.STYLE`.
- `MenuHtml.render(items)` -> `{ html, actions }`.

## Globals

None.
