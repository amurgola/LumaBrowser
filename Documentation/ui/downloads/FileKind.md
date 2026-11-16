# FileKind

`ui/downloads/FileKind.js`

The kind of file a download is, read from its name's extension, so the downloads page can draw a matching icon:
`document`, `sheet`, `image`, `video`, `audio`, `archive`, `app`, or `file` for anything else. Each kind has a
`dl-kind-<kind>` symbol in the sprite of [downloads.html](downloads.md); a new kind needs both.

## Methods

- `FileKind.of(filename)`.
- `FileKind.EXTENSIONS` (kind -> extensions, each listed once), `FileKind.OTHER`.

## Globals

None.
