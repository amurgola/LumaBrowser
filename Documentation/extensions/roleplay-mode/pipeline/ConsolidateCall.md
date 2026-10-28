# ConsolidateCall

`extensions/roleplay-mode/pipeline/ConsolidateCall.js`

Runs the consolidation completions when memory has grown: at most one
character fold and one story summary per turn, so a long roleplay pays a small
steady cost instead of re-summarising its whole history every turn.

## Methods

- `new ConsolidateCall(chat, logger)`; `ConsolidateCall.due(data)`.
- `foldRequest(data, char, beats)`, `summaryRequest(data, rows)` temperature
  0.2, 90 s, `noThink`.
- `run(data)` folds the first character past
  [CharacterChronicle](../world/CharacterChronicle.md)`.needsFold` (applying
  the arc and the growth fields through `CharacterProfile.apply(…, { growthOnly })`),
  then rewrites the summary when [StoryLedger](../world/StoryLedger.md)`.needsSummary`.
  Returns true when anything changed; failures leave the records untouched.
