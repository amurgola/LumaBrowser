# LegacyChatMigration

`core/llm-server/LegacyChatMigration.js`

One-time, non-destructive import of the retired AI-chat side panel's
conversations (settings key `aiChat.conversations`) into ChatStore.

## Methods

- `new LegacyChatMigration(settingsDb, chatStore, { log? })` where `settingsDb`
  is raw key/value access (`get`, `set`) and `chatStore` is ChatStore.
- `run()` returns `{ ran, migrated, skipped }`. Skips entirely (`ran: false`)
  when the marker key is set; otherwise imports every migratable conversation,
  stamps the marker, and logs a summary when there was anything to read.
- `LegacyChatMigration.readLegacyConversations(blob)` returns the conversation
  array from a bare array or a `{ conversations }` wrapper, else `[]`.
- `LegacyChatMigration.isVisibleLegacyMessage(message)` the legacy panel's display
  filter: user or assistant turns with string content, excluding user turns that
  start with `[Tool Result for ` and assistant turns containing a ```` ```tool ```` fence.
- `MARKER_KEY` (`aiChat.conversationsMigratedAt.v2`), `CONVOS_KEY`
  (`aiChat.conversations`), `DEFAULT_TITLE` (`Imported AI Chat`).

## Migration policy

- Only the visible transcript migrates. Machine turns encode a tool protocol the
  modern store models differently (`llm_messages.tool_calls`); replayed as text
  they would render as garbage.
- Non-destructive: the original blob stays as an archival backup.
- Idempotent twice over: the marker skips the pass, and a conversation whose
  legacy id already exists in ChatStore is skipped (covers a marker lost to a
  restored settings backup). Legacy ids are kept for exactly that reason.
- Timestamps survive: legacy ms epochs become `created_at`/`updated_at`, and
  messages are spaced 1 ms apart from `createdAt` so ChatStore's
  `(created_at, rowid)` order reproduces the original sequence.
- Conversations with no visible messages are not imported.
- One failing conversation is logged and skipped. The caller (LLMServerService
  constructor) wraps `run()` in try/catch so a migration bug never blocks boot.

## Why the blob shape and marker are odd

The panel's setter wrote a bare array while its getter wrapped it as
`{ conversations }`. The first migration read only the wrapper, imported nothing
on every real install, and still stamped its marker (found in the 2026-08-10
shakeout). Both shapes are accepted now and the marker is versioned (`.v2`) so
those installs re-run exactly once.

## Is it still needed

Yes, for now. LLMServerService still runs it on every boot, and an install that
last ran a build older than the 2026-08 fix and upgrades straight to this app
would otherwise strand its chat history. Once no supported upgrade path starts
before 2026-08, this class and its call can be deleted.

## Timestamps seam

Legacy times are written back with `ChatStore.restoreConversationTimestamps`
(the legacy version issued raw SQL through `chatStore.db`).
