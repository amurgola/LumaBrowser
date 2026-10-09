# CdpError

`extensions/cdp-driver/CdpError.js`

A JSON-RPC error. CDP has no HTTP status layer, so failures are `{ id, error }` frames.

## Methods

- `new CdpError(code, message, data)`.
- `CdpError.CODE`: `PARSE_ERROR -32700`, `INVALID_REQUEST -32600`, `METHOD_NOT_FOUND -32601`,
  `INVALID_PARAMS -32602`, `INTERNAL_ERROR -32603`, `SERVER_ERROR -32000`.
- Factories: `methodNotFound(method)` (`'<method>' wasn't found`), `invalidParams`,
  `invalidRequest`, `internal(msg, data)`, `server(msg, data)`.
- `CdpError.serialize(err)` -> `{ code, message, data? }`. A plain Error is
  `-32000` unless it carries a numeric `code`.
