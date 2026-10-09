# JsonLineReader

`core/desktop/uia/JsonLineReader.js`

Splits a stream of text chunks into JSON messages, one per line.

## Methods

- `new JsonLineReader()`.
- `push(chunk)` the messages the chunk completed. A partial last line waits for
  the next chunk; lines are trimmed (so CRLF is fine); blank and unparseable
  lines are skipped, so a stray log line cannot break the protocol.
