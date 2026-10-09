# ConversationExport

`extensions/ai-chat/ui/ConversationExport.js`

Exports every ChatStore conversation with its messages as a JSON download.

## Methods

- `ConversationExport.collect(api)`: `conv.list({ limit: 500 })`, then
  `conv.messages(id)` per conversation; resolves `[{ ...conv, messages }]`.
- `ConversationExport.download(api)`: collects, then saves
  `ai-chat-export-YYYY-MM-DD.json` through a blob URL and an anchor click.
- `ConversationExport.fileName(now?)`.

## Globals

Reads `document`, `URL.createObjectURL`/`revokeObjectURL`, `Blob`.
