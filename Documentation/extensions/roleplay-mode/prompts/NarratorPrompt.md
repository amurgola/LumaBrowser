# NarratorPrompt

`extensions/roleplay-mode/prompts/NarratorPrompt.js`

A facade over [NarratorContext](NarratorContext.md) for callers that only want
what the narrator is told apart from the history: the stable head and the
story state as one text.

## Methods

- `NarratorPrompt.build(data)` is `NarratorContext.build(data).contextText`.
