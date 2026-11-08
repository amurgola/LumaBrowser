# GroundingScope

`extensions/roleplay-mode/grounding/GroundingScope.js`

One grounding pack in the knowledge base: its cards
([GroundingCards](GroundingCards.md)) kept in their own RAG scope, synced from
the pack folder once per instance (new or edited cards added by hash, cards
gone from the pack removed) and searched with `core/rag/KnowledgeRetriever`.
[BodyGrounding](BodyGrounding.md) and [SurfaceGrounding](SurfaceGrounding.md) sit on it; it never decides which card
applies to whom.

## Methods

- `new GroundingScope({ scope, dir, pack, rag?, cards?, Retriever? })`;
  `rag()` (the given one or `global.__lumaRagService`), `cards()`, `card(id)`.
- `sync()` -> `{ added, removed, total }`, or null without a knowledge base
  (not cached); a failure is retried on the next call.
- `search(query, limit)` -> `[{ card, rank }]` best first.
- `GroundingScope.hits(phrases, paddedLower, synthetic?, weight?)` counts
  whole-word phrase matches; `padded(text)` prepares text for it.
