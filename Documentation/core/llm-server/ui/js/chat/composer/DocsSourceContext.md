# DocsSourceContext

`core/llm-server/ui/js/chat/composer/DocsSourceContext.js`

The "@lumabrowser-documentation" source. Picking "LumaBrowser documentation" in
the composer's "@" menu ([ComposerCommands](ComposerCommands.md); `@docs`,
`@documentation` and `@lumabrowser` narrow to it) turns on a conversation-wide
pill above the composer ([AttachmentStrip](AttachmentStrip.md), `.cm-att.docs`,
the book icon, an x that turns it off). Unlike a tab or the Dashboard it
attaches no text: `state.docsSource` is a flag [TurnFlags](../stream/TurnFlags.md)
puts on every send and regenerate as `docsSource` (always a boolean), and the
router gives such turns the documentation search tool, or a retrieval pre-pass
when Tools are off ([DocsSourceGrant](../../../../chat/router/DocsSourceGrant.md)).

The flag lives in the conversation's meta (`data.docsSources:
['lumabrowser-documentation']`): the router writes it on every turn that carries
the flag, the composer writes it when the pill is toggled on an open
conversation (a read-modify-write, since `meta.set` replaces the data bag whole),
and [ConversationView](../conversation/ConversationView.md) restores it when a
conversation is reopened. A landing chat has no row yet: the first turn carries
the flag and the router persists it. New chat and a mode launch reset it
(`ChatState.resetChatOptions`).

Hidden where the host has no index: `api.docsSource.status()` is asked once at
mount ([ChatMode](../ChatMode.md)); the web client has no such API and a build
without `resources/docs-rag/docs-rag.db` answers `available: false`.

## Methods

- `load()`: asks the host once; `available()`, `status()`.
- `DocsSourceContext.matches(query)`: the typed mention query is empty or a
  prefix of one of `ALIASES`.
- `on()`, `set(on)` (repaints the chips, persists onto the open conversation),
  `enable()` (also focuses the composer), `disable()`.
- `restore(conversationId)`: sets the flag from the conversation's meta.
- `pillHtml()`: the chip, its hover text naming the page count.
- `DocsSourceContext.iconHtml()`, `NAME`, `MENTION`, `ALIASES`, `HINT`, `SOURCE_ID`.

## Globals

None.
