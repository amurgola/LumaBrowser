# MultipartForm

`core/whisper-server/service/MultipartForm.js`

A minimal dependency-free `multipart/form-data` encoder.

## Methods

- `MultipartForm.build(fields, file)` returns `{ buffer, contentType }`.
  `fields` is `{ name: value }` (or null); `file` is `{ name, filename, type, data }`
  where `data` is a Buffer or Uint8Array, written verbatim. The boundary is
  `----LumaVoice<random>`.
- Statics: `BOUNDARY_PREFIX`.

## Why

whisper-server's `/inference` wants a classic file upload; axios' FormData
handling across adapters was not worth the ambiguity for one endpoint.
