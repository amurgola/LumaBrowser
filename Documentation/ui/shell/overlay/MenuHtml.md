# MenuHtml

`ui/shell/overlay/MenuHtml.js`

Popup menu markup and the extra overlay CSS (hints, checks, disabled rows, the downloads list). Each label sits in
`.bd-menu-label` (one line, ellipsised) so long page titles never wrap over the next row. Hints and check
labels are 11px `--text-muted`, right-aligned; the rules read the shared tokens the overlay page links.

## Methods

- `MenuHtml.STYLE`.
- `MenuHtml.render(items)` -> `{ html, actions }`.

## Globals

None.
