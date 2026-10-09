# ChatStore

`core/llm-server/ChatStore.js`

Repository for the LLM chat history: conversations, messages, regeneration
variants and per-conversation chat-mode meta. Plain prepared SQL over the
better-sqlite3 handle SettingsDatabase owns; rows come back camelCase.

## Methods

- `new ChatStore(settingsDb)` uses `settingsDb.db` (throws via
  `StoreHandle.requireOpen` when there is no open handle) and prepares every
  statement in `ChatStore.SQL` once. It never closes the handle. `store.db` is
  the raw handle, kept public for legacy callers.

Conversations:

- `createConversation({ id?, title?, modelRef?, provider?, toolsEnabled?, disabledTools?, choicesEnabled?, mode?, hidden? })`
  returns the hydrated conversation. A caller id is kept (the renderer's
  optimistic id), otherwise `conv_<ms>_<rand>`. Title defaults to `New chat`,
  mode to `chat`.
- `getConversation(id)` returns the conversation or `null`. Not filtered by
  hidden or archived (the run-history viewer reads hidden rows by id).
- `listConversations({ includeArchived = false, includeHidden = false, limit = 200, offset = 0 })`
  pinned first, then newest `updated_at`; limit capped at 1000.
- `searchConversations(q, { limit = 50, includeArchived = false })` matches the
  title or any message content (`LIKE %q%`), one row per conversation, never
  hidden rows; limit capped at 200; blank `q` returns `[]`.
- `renameConversation(id, title)`, `setConversationModel(id, modelRef, provider)`,
  `setConversationTools(id, enabled)`, `setConversationDisabledTools(id, names)`,
  `setConversationChoices(id, enabled)`, `setConversationReasoningEffort(id, position)`,
  `setConversationMode(id, mode)`, `touchConversation(id)`, `pinConversation(id, pinned)`,
  `archiveConversation(id, archived)` each bump `updated_at` and return whether
  a row changed.
- `restoreConversationTimestamps(id, createdAt, updatedAt)` writes both times
  verbatim (no bump); used by [LegacyChatMigration](LegacyChatMigration.md).
- `deleteConversation(id)` deletes messages, meta and the row in one
  transaction; returns whether the row existed.

Chat-mode meta:

- `getMeta(conversationId)` always returns `{ conversationId, mode, data, updatedAt }`;
  with no meta row the mode comes from the conversation row (else `chat`),
  `data` is `{}` and `updatedAt` is `null`.
- `setMeta(conversationId, { mode?, data? })` upserts the meta row and writes the
  conversation's `mode` in the same transaction. A missing `mode` or `data`
  keeps the current value. Throws without a conversation id.

Messages:

- `addMessage({ conversationId, role, content?, reasoning?, modelRef?, provider?, tokensIn?, tokensOut?, error?, toolCalls?, variantGroup?, variantActive = 1, createdAt?, parentId?, id? })`
  inserts and touches the conversation in one transaction; returns the message.
  Throws without `conversationId` or `role`. `parentId` is the message this one
  follows: a variant passes its turn's parent (from `startVariant`); omitted, it
  continues the visible thread ([MessageTree](chat/MessageTree.md)`.leafId`).
- `updateMessage(id, patch)` writes only the provided `content`, `reasoning`,
  `tokensIn`, `tokensOut`, `error`, `toolCalls`; `false` for an unknown id.
- `getMessage(id)`, `listMessages(conversationId)` (every variant, oldest first).
- `listActiveMessages(conversationId)` the active branch
  ([MessageTree](chat/MessageTree.md)`.activePath`), with `variantCount` (0
  when the turn has no variants) and, for turns with variants, `variantIndex`
  (1-based, oldest first).
- `getVariants(group)`, `setActiveVariant(messageId)`, `startVariant(messageId)`
  (a reply to regenerate or a prompt to edit; returns
  `{ group, parentId, createdAt }` or `null`).
- `deleteMessage(id)` moves the message's children up to its parent first, so
  the rest of the thread survives; `clearMessages(conversationId)` (keeps the
  conversation and its meta; backs the roleplay "Restart").

## Behaviour worth knowing

- **Order.** Timestamps are millisecond ISO strings written by the store, not
  SQLite's second-resolution `datetime('now')`; a user message and its
  assistant placeholder land in the same second, so every list orders by
  `created_at, rowid`.
- **Branches.** Messages form a tree through `parent_id`. All variants of one
  turn (regenerated replies, or edited prompts) share `variant_group` (the first
  variant's id) and the turn's parent, and exactly one is active. Each variant
  keeps its own continuation, so switching a variant brings back what followed
  it. A variant is inserted with the original turn's `created_at`, keeping the
  pager in insertion order.
- **Tri-states.** `choices_enabled` is NULL when the chat UI never set it
  (system-owned rows), which the router treats as off. `reasoning_effort` NULL
  means "inherit the Setup default", distinct from an explicit `default` (Auto);
  a blank position clears it, an unknown one is stored as `default`
  (`ReasoningEffort.normalizeDial`).
- **Denylist.** `disabledTools` is stored as a trimmed JSON array, or NULL when
  empty or not an array, so clearing restores the full tool set; it hydrates to
  `[]` when absent.
- **Corrupt JSON.** `tool_calls` and meta `data` that fail to parse come back as
  `{ _raw: text }` (via `JsonColumn.parse`).
- **Hidden** rows (scheduled-task transcripts) are a stronger "archived": out of
  the list and search, still readable by id.
