# ConversationProvider

`core/palette/providers/ConversationProvider.js`

Search palette provider for chat conversations: a title match
([PaletteMatcher](../PaletteMatcher.md) over up to 1000 conversations, archived
included) or a full-text match in the messages
([ConversationIndex](../ConversationIndex.md)), whichever is stronger. A
conversation found both ways gets a 0.15 bonus. The matching message's snippet,
with its highlights, becomes the subtitle; without one the subtitle is the date.

## Methods

- `new ConversationProvider({ getChatStore, index })`.
- `search(query, { limit = 6 })`.
- `ConversationProvider.ftsScore(bm25)`: maps the unbounded BM25 score onto
  0.35 to 1.1 so groups can be compared.
- `ConversationProvider.item(conv, { score, marks, snippet })`: a `conversation`
  row, tagged `Archived` when archived.
- `ConversationProvider.when(iso)`: "Conversation, Nov 6, 2026".

Hidden sub-conversations (delegations) never show.
