# ImageServerLogTail

`core/llm-server/chat/bridge/tools/media/ImageServerLogTail.js`

Appends the image runtime's recent stderr to an image tool's error.

## Methods (all static)

- `append(baseMessage)`: the newest `MAX_LINES` (6) stderr lines across the
  edit and primary runtime servers, sorted by timestamp, as
  `\nsd-server log:\n...`; the message unchanged when nothing is available.
