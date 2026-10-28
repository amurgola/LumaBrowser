# ConsolidatePrompt

`extensions/roleplay-mode/prompts/ConsolidatePrompt.js`

The two consolidation calls. Fold: a character's oldest beats into their
rolling arc (80 to 150 words) with the growth fields updated (`{ arc, wants,
hides, bondUser }`). Summary: the story-so-far rewritten (150 to 350 words)
under fixed headings (`Where we are`, `What has happened`, `What each present
character wants right now`, `Open threads`, `Facts that must not change`) from
the ledger rows since the last one, keeping what is still true.

## Methods

- `foldMessages(data, char, beats)`, `summaryMessages(data, rows)`.
- `parseFold(text)` (null without an `arc`), `parseSummary(text)` (reasoning
  and fences stripped).
