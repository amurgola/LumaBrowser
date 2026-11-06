# ConversationIndex

`core/palette/ConversationIndex.js`

Full-text index over chat messages (user and assistant text) so the search
palette finds a conversation from a vague sentence. An FTS5 table,
`llm_messages_fts` (`porter unicode61` tokenizer), keyed by `llm_messages.rowid`
and kept in step by insert, delete and content-update triggers on `llm_messages`.
Ranked by BM25, with a snippet of the best message.

## Methods

- `new ConversationIndex(settingsDb)`: nothing is created yet.
- `ensure()`: on the first call per database, creates the table and triggers and
  backfills the existing history in one transaction; returns how many messages
  that call indexed (0 afterwards).
- `search(text, { limit = 8 })`: `[{ conversationId, score, hits, snippet: { text, marks } }]`,
  one row per conversation, best first. The score is the best message's BM25
  turned positive plus `log2(hits)`, so more matching messages nudge a
  conversation up. `[]` for text with no searchable words or a failing query.
- `ConversationIndex.expression(text)`: the FTS5 MATCH text, built with the
  knowledge base's `QueryTermExtractor` and `LexicalMatchExpression`, minus
  `RECALL_WORDS` (words that describe a past chat rather than its topic: "the one
  where we talked about...").
- `ConversationIndex.marked(raw)`: splits the snippet's control-character
  delimiters into plain text and `[start, end)` mark ranges.

## Why

The index is built lazily (on the first search, or by
[PaletteService](PaletteService.md) 20 seconds after boot) so start-up never pays
for it. Creating the triggers and running the backfill in the same transaction
means no message can be written between the two and be missed. Snippets use
control characters as delimiters and become mark ranges, never HTML, so message
text cannot inject markup into the palette.
