# ConversationExporter

`core/llm-server/ipc/ConversationExporter.js`

Downloads a conversation as a PDF or a full-page PNG.

## Methods

- `new ConversationExporter({ llmServerService, deps, electronApi?, buildHtml?, renderer?, writeFile?, log? })`
  (defaults electron, `ConversationExportHtml.build`, a lazy `ConversationExportRenderer`, `fs.writeFileSync`).
- `export(event, conversationId, kind)`:
  - `Unknown export format.` unless `kind` (any case) is `pdf` or `png`;
  - `Conversation not found.` for an unknown id;
  - shows the save dialog (parented to the sender's window when it has one,
    default `<Downloads>/<safe title>.<kind>`); a dialog error is `{ success: false, error }`
    and a cancel `{ success: false, canceled: true }`;
  - builds the share-viewer projection (`ConversationExportData.build` with the
    active messages and the conversation's artifacts), renders it and writes the
    bytes: `{ success: true, path }`, or `{ success: false, error }` (logged).

## Why

The destination is picked first, so a cancel costs nothing.
