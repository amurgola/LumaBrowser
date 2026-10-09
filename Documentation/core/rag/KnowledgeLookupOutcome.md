# KnowledgeLookupOutcome

`core/rag/KnowledgeLookupOutcome.js`

The result shapes of a knowledge-base lookup, `{ found, rendered, sources,
message }`, and every model-facing wording.

## Methods

- `KnowledgeLookupOutcome.blank()`: not found, message `BLANK` (asks for the
  words or question to find, as `"query"`).
- `KnowledgeLookupOutcome.of(query, passages, terms)`:
  - no passages: not found, `The user's documents have nothing matching
    "<query>". Try once more with other key words, or tell the user their
    documents do not cover it.`
  - passages: `found: true`; `rendered` from
    [PassageCitationRenderer](PassageCitationRenderer.md); `sources` from
    [SourceCardBuilder](SourceCardBuilder.md) (excerpts highlighted with
    `terms`); `message` is `N passage(s) from the user's documents, most
    relevant first. Answer from them and put the tag of each passage you use
    right after the fact, like [S1].`, a newline, then `rendered`.

## Why

Keeping the wording in one class keeps it consistent and testable. The miss
message invites one retry with other words because lexical search is literal;
the chat ledger already caps repeated calls to the tool. The hit message shows
the exact tag format to copy.
