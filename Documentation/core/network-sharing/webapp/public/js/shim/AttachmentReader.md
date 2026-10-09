# AttachmentReader

`core/network-sharing/webapp/public/js/shim/AttachmentReader.js`

The shim's attachment surface: images only on the web.

## Methods

- `new AttachmentReader({ doc, FileReaderImpl = FileReader })`.
- `pick()`: a native `<input type="file" accept="image/*" multiple>`; resolves
  `{ success: true, files }` or `{ success: true, canceled: true, files: [] }`.
- `readDropped(files)`: images read, every other file returned as
  `{ name, size, error: 'Only images can be attached here.' }`.
- `readAll(files)`: each as `{ name, size, kind ('image'|'file'), mime (default image/png), base64 }`,
  or `{ name, kind: 'image', error: 'read failed' }`.
