# ResponseCharset

`core/llm-server/chat/safe-fetch/ResponseCharset.js`

Maps a Content-Type charset to a Buffer encoding.

## Methods

- `ResponseCharset.encodingFor(contentType)`: `utf8` for UTF-8 / ASCII,
  `latin1` for ISO-8859-1 / windows-1252, `utf16le` for UTF-16; no charset or an
  unknown one is `utf8` (decoded with replacement characters).
