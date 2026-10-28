# ProsePolishCall

`extensions/roleplay-mode/pipeline/ProsePolishCall.js`

The optional polish pass over a finished reply (`options.prosePolish`): when
[ProseSlop](../prompts/ProseSlop.md) flags paragraphs, one completion rewrites
up to `MAX_PARAGRAPHS` (4) of them and the reply is replaced in the
conversation (the mode reaction's `replaceContent`) before the stage call reads
it. Off by default.

## Methods

- `new ProsePolishCall(chat, logger)`; `ProsePolishCall.wanted(data)`.
- `request(data, content, flagged)` temperature 0.5, 90 s, `noThink`.
- `run(data, content)` -> `{ content, changed, score }`; clean prose, a
  failure or an unusable reply return the text unchanged.
