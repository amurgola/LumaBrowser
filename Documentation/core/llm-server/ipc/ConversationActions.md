# ConversationActions

`core/llm-server/ipc/ConversationActions.js`

The chat sidebar's conversation and message operations over [ChatStore](../ChatStore.md).

## Methods

`new ConversationActions(llmServerService)`; the store is read from
`llmServerService.chatStore` on every call.

| Method | Reply |
|---|---|
| `list(opts)`, `search(q, opts)` | `{ conversations }` |
| `get(id)`, `create(data)` | `{ conversation }` |
| `rename`, `archive`, `pin`, `setVariant`, `deleteMessage`, `clearMessages`, `setTools` (boolean), `setDisabledTools`, `setChoices` (boolean), `setReasoningEffort` | `{ success }` from the store |
| `messages(conversationId)` | `{ messages }`, the active variant of each turn only |
| `variants(group)` | `{ variants }` |
| `addMessage(msg)` | `{ message }` |
| `updateMessage(id, patch)` | `{ success }`; content only, `content required` unless `patch.content` is a string |
| `getMeta(id)`, `setMeta(id, patch)` | `{ meta }`, always a normalised `{ mode, data }` |

## Why

Superseded regenerations stay browsable through `variants` but never re-enter the
thread or the model's context. The reply edit rewrites content only so the
pager and token stamps keep working.
