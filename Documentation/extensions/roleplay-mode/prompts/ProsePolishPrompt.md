# ProsePolishPrompt

`extensions/roleplay-mode/prompts/ProsePolishPrompt.js`

The optional line-editor call: rewrite only the flagged paragraphs, keeping
every event, quoted line, name and `**Name:**` speaker tag.

## Methods

- `messages(content, flagged)` `[system, user]`; the user turn lists the
  flagged phrases and the numbered paragraphs.
- `parse(text)` `{ [index]: text }` or null.
- `splice(content, rewrites)` -> `{ content, changed }`; a rewrite that fails
  `keepsSubstance(before, after)` (the speaker tag or any quoted line lost) is
  refused for that paragraph.
