# ConversationExportData

`core/llm-server/chat/ConversationExportData.js`

The read-only projection of a conversation that a PDF/PNG export paints.

## Methods

- `ConversationExportData.build({ conversation, messages, artifacts, getArtifact })`
  returns `{ success: true, mode: 'export', exportedAt, conversation: { title,
  createdAt, updatedAt }, messages: [{ id, role, content, error, createdAt,
  artifacts }], artifacts: [{ id, title, type, language }] }`. Message artifact
  refs come from `message.toolCalls.artifacts`, deduped by id, as `{ id, title,
  type, rawUrl? }`. Every input may be missing; a throwing `getArtifact` is
  treated as "not found".

## Why

It mirrors the public share link's `/share/:token/data` route on purpose
(dialogue and artifact refs only: no reasoning, tool params, token counts or
model refs), so a downloaded document reads exactly like the shared page.

The one difference: image and video artifacts carry their bytes as a `data:` URL
(`rawUrl`) because the exported document has nothing to fetch from. The mime
type is the artifact's `language`, else `video/mp4` or `image/png`.

Part of the export trio with [ConversationExportHtml](ConversationExportHtml.md)
and [ConversationExportRenderer](ConversationExportRenderer.md).
