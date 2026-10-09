# ShareArtifacts

`core/network-sharing/webapp/public/js/share/ShareArtifacts.js`

A shared turn's artifacts.

## Methods

- `new ShareArtifacts({ base, exportMode })`.
- `elements(artifacts)`: up to two rows. `.sv-media`: images (`img.sv-img`, lazy,
  eager in export mode) and videos (controls, loop, muted, inline; metadata
  preload in export mode) from `rawUrl` or `<base>/artifact/<id>/raw`.
  `.cm-artifacts`: everything else as an `a.sv-chip` opening `<base>/artifact/<id>`
  in a new tab (`noopener`), or a plain `span.sv-chip` in export mode (no server
  behind a downloaded document). Chip text is escaped; `live` reads `interactive`.
- `url(id)`: `<base>/artifact/<id>`.
