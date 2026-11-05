# AcpPromptBlocks

`cli/lib/acp/AcpPromptBlocks.js`

Turns an ACP prompt (a list of content blocks) into the bridge's `prompt` frame.

## Methods (static)

- `toBridgePrompt(blocks)` -> `{ text, images, context }`:
  - `text` blocks are concatenated;
  - a `resource_link` reads as its path inside the sentence (` C:\p\a.js `), so a
    mention stays where the user put it and the agent can read the file;
  - an embedded `resource` with `text` becomes an editor context item
    `{ path, text }` (the block [IdeContextFormatter](../../../core/llm-server/chat/IdeContextFormatter.md)
    renders) and is named in the text; one with an image `blob` becomes an image;
  - an `image` block becomes `{ name, mime, base64 }` (name from its `uri`, else `image`);
  - audio, unknown and malformed blocks are dropped. The text is trimmed.
- `pathOf(uri)`: `file:` URIs to paths (`fileURLToPath`, with a plain strip as the
  fallback); anything else is returned as given.
