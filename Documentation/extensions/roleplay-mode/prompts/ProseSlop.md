# ProseSlop

`extensions/roleplay-mode/prompts/ProseSlop.js`

The phrases that mark machine prose (the antislop, EQ-Bench and Director-preset
lists folded together), the "not X but Y" and "doesn't just X" shapes, and the
stock names, with a cheap score over a passage.

## Methods

- `ProseSlop.hits(text)` `[{ phrase, index }]`, longest phrases first so an
  inner phrase is not counted twice.
- `score(text)` `{ hits, words, perHundred }`; `wordCount(text)`.
- `flaggedParagraphs(text)` blank-line paragraphs with at least one hit, for
  the polish pass.
- `PHRASES`, `STOCK_NAMES`, `NOT_BUT`, `DOESNT_JUST`.
