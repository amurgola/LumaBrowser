# DelegationTools

`core/llm-server/chat/delegation/DelegationTools.js`

The chat agent's delegation tools, registered by [CoreMcpTools](../../../../app/browser/CoreMcpTools.md)
as aggregator source `core.delegation` (the "Delegation" group of the Tools
menu; one lazy group in the agent prompt, see [MergedSourceTable](../tool-groups/MergedSourceTable.md)).
A chat hands a task to a chat mode or custom agent, which runs in a
sub-conversation nested under the chat while the user stays in it.

## Methods

- `new DelegationTools({ getRouter, registry })`: `getRouter()` returns the
  UnifiedChatRouter or null; `registry` the ChatModeRegistry (wrapped in
  [DelegateTargets](DelegateTargets.md)).
- `handler()` the aggregator handler `(name, args, opts) => handle(...)`.
- `handle(name, args, opts)` returns an MCP result ([McpResult](../../../shell/McpResult.md)).
  Errors (`isError`): no `opts.chat.conversationId` (`only works inside the
  LumaBrowser chat`: external MCP clients cannot delegate), no router yet,
  unknown tool.
- `DelegationTools.TOOLS`, `SOURCE` (`core.delegation`), `NOTE`, `MAX_TITLE_CHARS` (60).

## Tools

- `list_delegates {}` answers `{ success, targets: [{ target, label,
  description, params }], subConversations: [{ conversationId, title, mode }] }`
  (this chat's, via `ChatStore.listSubConversations`).
- `delegate_task { target, task, name?, projectPath?, ... }` starts one: the
  target by id or label, `task` required, the mode's `start` (its error returned
  as is), the model this chat uses (else `listModels().defaultRef`), then
  `createConversation({ title, modelRef, provider, toolsEnabled: true, mode,
  parentConversationId })` and `setMeta` with the mode's data plus
  `delegatedFrom`. The title is the mode's, else `name`, else the task, with
  whitespace collapsed and capped at 60 characters.
- `delegate_task { conversationId, message }` continues one of THIS chat's
  sub-conversations, its active history replayed as role/content.

Both run a [SubConversationRun](SubConversationRun.md) with the card label
`<kind>: <title>` (the kind is the target label up to its first colon: `Code`,
`Game`, `Agent`) and answer `{ success, conversationId, title, status,
reply, target? (on start), error?, note }`. A failed sub-turn is
`success: false` with `status: 'failed'`, not a thrown error.

Every run gets `runApprovals` for its sub-conversation: `granted` is
`meta.data.approvedTools`, and `onGranted(name)` appends a new "allow for this
run" grant there (once). So a build asks at most once per tool, even when the
chat reaches back into it with a later `delegate_task`; another sub-conversation
starts with none.

Guards: a sub-conversation cannot delegate again (one level only); a missing
`target` or `task`, an unknown target (the error lists the ids), a conversation
that is not this chat's sub-conversation, and a continue without `message` each
answer with a readable error.

## Why

The builder tools only exist inside their mode's turn (its prompt, budget and
staging workspace), so the regular chat cannot just be given them. Handing the
work to a real mode conversation keeps all of that, and the user can open it.
