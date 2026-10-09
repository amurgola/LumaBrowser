# MessageTree

`core/llm-server/chat/MessageTree.js`

The branch structure of a conversation's messages. Each `llm_messages` row
points at the message it follows (`parent_id`); siblings under one parent are
the variants of that turn (a regenerated reply or an edited prompt), each with
its own continuation. The visible thread is the path that follows the active
sibling (`variant_active = 1`, newest first; the newest sibling when none is
flagged) at every level. A row whose parent is gone hangs off the root.

## Methods

- `MessageTree.activePath(rows)`: the active path, root first. Rows of one
  conversation in insertion order, snake_case. When none of several rows carries
  a parent link (pre-branching data) it falls back to the old flat reading:
  every active row in order.
- `MessageTree.leafId(rows)`: the end of the active path (what a new message
  continues from), or null.
- `MessageTree.legacyParents(rows)`: `Map(id -> parentId|null)` for flat rows:
  a row follows the last active row before it, and every variant of a turn
  shares its first variant's parent. Used by
  [SettingsMigrations](../../database/settings/SettingsMigrations.md) once.

## Globals

None.
