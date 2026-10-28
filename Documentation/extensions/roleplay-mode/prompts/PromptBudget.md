# PromptBudget

`extensions/roleplay-mode/prompts/PromptBudget.js`

Token arithmetic for the narrator's context.

## Methods

- `PromptBudget.window(data, contextWindow)` the router's window when passed,
  else the setup's `llmCtx`, else `DEFAULT_WINDOW` (16384).
- `estimate(text)`, `estimateMessages(messages)` at `CHARS_PER_TOKEN` (3.6).
- `layerTokens(layer, window)` the cap for `brief`, `premise`, `story`, `card`,
  `offstage`, `offstageTotal`, `setting`, `anchor`, scaled from the 16k reference
  between 0.5x and 3x. `historyTokens(window)` is `HISTORY_SHARE` (0.5).
- `clip(text, tokens)` cuts at a sentence or line with an ellipsis mark.
