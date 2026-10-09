# DocsSourceGrant

`core/llm-server/chat/router/DocsSourceGrant.js`

What a chat turn gets when the conversation has the "@lumabrowser-documentation"
source on (the `docsSource: true` flag every chat-UI turn carries, see
[TurnFlags](../../ui/js/chat/stream/TurnFlags.md)):

- on the Tools path, a session tool, `search_lumabrowser_docs`, bound to the
  [DocsKnowledgeBase](../../../rag/DocsKnowledgeBase.md), plus a prompt note
  telling the model the documentation is attached and to search it before
  answering anything about LumaBrowser itself. The tool rides
  [AgentTurnDispatch](AgentTurnDispatch.md)'s `extraTools` like a mode's own
  tools (its own handler, forced active, documented from its schema), and its
  name is added to a restricted allow-list so a gear-panel denylist cannot drop
  it;
- on the plain path (Tools off), a retrieval pre-pass: the passages matching the
  last user message are folded into the system head
  (`ChatStyleDocs.appendToSystemHead`) inside a `<lumabrowser_documentation>`
  block, so a model without tools still answers from the docs.

Nothing at all when the flag is off or the index is not on this build, so an
untagged chat never pays for it.

## Methods

- `DocsSourceGrant.forTurn(docs, on)`: a grant, or `null` unless `on === true`
  and `docs.available()`.
- `extraTool`: `{ name: 'search_lumabrowser_docs', description, inputSchema
  ({ query } required), handler(params, ctx) }`. The handler searches, emits the
  citation map as a `citations` agent event through `ctx.emit` (like
  `search_knowledge_base`) and resolves `{ success: true, found, message }`,
  the message carrying the `[S1]`-tagged passages or a "no passages" nudge. `q` is
  accepted for `query`; a bare-string call is wrapped as `{ query }` by
  [BareArgumentRepair](../BareArgumentRepair.md) from this schema.
- `note`: the prompt note (`DocsSourceGrant.NOTE`).
- `DocsSourceGrant.allowing(allowedTools, grant)`: the allow-list with the tool
  added when it is an array and a grant exists; `null` stays `null`.
- `prepass(messages)`: the plain-path messages with the matching passages in the
  system head (`PREPASS_K` = 4 passages, the query being the last user message's
  trailing `MAX_QUERY_CHARS` = 2000 characters); the same array when there is no
  user text or nothing matched.
- `DocsSourceGrant.TOOL`, `SOURCE_ID` (`lumabrowser-documentation`, the value
  [TurnConversation](TurnConversation.md) stores in the meta's `docsSources`).

## Why

A separate tool rather than a scope on `search_knowledge_base`: that tool and its
manual are about the user's own uploads and read the user's database; the
documentation is a different kind of source, worded differently to the model, and
lives in a read-only file. Using the `extraTools` seam means no change to the
tool catalog, group tables or schemas, and the gear panel never lists a tool that
only exists while the pill is on.
