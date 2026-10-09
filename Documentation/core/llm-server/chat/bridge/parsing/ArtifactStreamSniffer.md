# ArtifactStreamSniffer

`core/llm-server/chat/bridge/parsing/ArtifactStreamSniffer.js`

Reads fields out of a create_artifact call that is still streaming.

## Methods (all static)

- `field(buf, name)`: a closed top-level string field, unescaped, or null.
- `stringValue(buf, name)`: the value from its opening quote to the closing
  one, or to the end of the buffer while it streams; null before it starts.
- `unescape(s)`: best-effort JSON unescape; a dangling backslash is dropped.
- `ESCAPES`.
