# BodyGrounding

`extensions/roleplay-mode/grounding/BodyGrounding.js`

Grounds the narrator in how real bodies work. The curated body-variation cards
in `grounding/packs/body/` (age bands, size and build, pregnancy stages,
mobility and limbs, senses, ongoing conditions; 32 cards) are stored in the
app's knowledge base under the scope `roleplay:body`, and for every character
on stage the cards their description calls for are retrieved and handed to
[NarratorContext](../prompts/NarratorContext.md) as body notes
([BodyNotes](../prompts/BodyNotes.md)).

Storage and retrieval are the RAG system's own ([GroundingScope](GroundingScope.md): `core/rag/KnowledgeRetriever` over the
scope), queried with the character's description and appearance plus the
[BodySignals](BodySignals.md) tags. The retriever only proposes candidates: a
card is kept when at least one of its tag phrases appears in the character's
text as whole words (a synthetic band counts 3), so an ordinary body gets no
card at all. Kept cards are ranked by tag hits then retrieval rank, one per
`Group`, at most `PER_CHARACTER` (3); after the first, a card needs
`SECONDARY_MIN_HITS` (2), so one stray word ("retired", "skinny") cannot add a
second or third card. The adult sex differences card has no natural trigger
on purpose: it is reference material in the scope, not a note pinned on a
character for their sex.

Best effort throughout: no knowledge base (`global.__lumaRagService`), an
empty scope or any failure means no notes, never a broken turn.

## Methods

- `new BodyGrounding({ rag?, cards?, Retriever? })`; `BodyGrounding.shared()`
  is the instance the mode uses.
- `BodyGrounding.enabled(data)`: false when the story set
  `options.bodyGrounding: false`.
- `sync()` brings the scope in line with the pack once per instance: new or
  edited cards added (deduped by hash), cards no longer in the pack removed.
  Resolves `{ added, removed, total }`, or null without a knowledge base (not
  cached, so a later turn syncs once the knowledge base is up).
- `forCast(characters)` -> `{ [characterId]: [{ id, title, body }] }`; never
  rejects. Results are cached per query.
- `forCharacter(c)`, `BodyGrounding.tagHits(card, paddedLowerText, synthetic)`,
  `BodyGrounding.describe(c)` (description, appearance, profile summary and
  appearance; not outfit, voice or wants).

## Writing cards

One `## Title` per card, then `Tags:`, optional `Group:`, then short bullet
lines (Moves, Limits, Cold and heat, Under stress, Keep them a person, Fiction
gets wrong). Keep a card under about 1400 characters, lead with what a scene
most needs, and write tags as specific phrases ("bad knees", not "bad"). The
"Fiction gets wrong" line is shown first, as "Avoid". An edited card is picked
up on the next app start (its hash changes and the old copy is removed).
