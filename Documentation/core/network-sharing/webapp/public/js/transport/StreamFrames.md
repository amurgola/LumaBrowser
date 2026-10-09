# StreamFrames

`core/network-sharing/webapp/public/js/transport/StreamFrames.js`

Reads a streamed response body as text frames split on a separator.

## Methods

- `StreamFrames.read(body, separator, onFrame)`: decodes `body.getReader()`
  chunks with a streaming TextDecoder and calls `onFrame(frame)` per complete
  frame; `onFrame` returning `true` stops reading (resolves `true`), else it
  resolves `false` at end of stream. A trailing partial frame is dropped, as in legacy.
- `StreamFrames.SSE` (`'\n\n'`) and `StreamFrames.NDJSON` (`'\n'`).
- `StreamFrames.json(line)`: the parsed object, or `null` for a blank or malformed line.
