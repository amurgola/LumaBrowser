# EditorFileReader

`core/llm-server/chat/workspace/EditorFileReader.js`

Reads one workspace file for the Monaco editor.

## Methods

- `EditorFileReader.read(absPath, relPath)`. Throws if the path does not exist.
  - Not a file: `{ success: false, error: 'Not a file.' }`.
  - Image (png, jpg, jpeg, gif, webp, bmp, ico): `{ success: true, path, image:
    true, dataUrl, size }`, or an error past `MAX_IMAGE_BYTES` (6 MB).
  - Text (including SVG, so it stays editable): `{ success: true, path,
    content, size }`. Past `MAX_READ_BYTES` (2 MB): `{ success: false, error,
    tooLarge: true }`. A NUL in the first 8 KB: `{ success: false, error,
    binary: true }`.

## Why

Opening a binary file in a text editor and saving it back would corrupt it, so
binaries are refused outright. Images are returned as data URLs because the
editor previews game sprites.
