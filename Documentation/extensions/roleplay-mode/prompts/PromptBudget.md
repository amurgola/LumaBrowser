# PromptBudget

`extensions/roleplay-mode/prompts/PromptBudget.js`

Token arithmetic for the narrator's context.

## Methods

- `PromptBudget.window(data, contextWindow)` the router's window when passed,
  else the setup's `llmCtx`, else `DEFAULT_WINDOW` (16384).
- `estimate(text)`, `estimateMessages(messages)` at `CHARS_PER_TOKEN` (3.6).
- `layerTokens(layer, window)` the cap for `brief`, `premise`, `story`, `card`,
  `offstage`, `offstageTotal`, `setting`, `anchor`, `body` (520, one
  character's body notes) and `bodyTotal` (2400, all of them), `surface` (700, this turn's up-close notes), scaled from the 16k reference
  between 0.5x and 3x. `historyTokens(window)` is `HISTORY_SHARE` (0.5).
- `clip(text, tokens)` cuts at a sentence or line with an ellipsis mark.

## Room for the reply

`historyFor(window, systemPrompt, postHistoryPrompt)` is the history budget
NarratorContext trims to. It is the usual half-window share, but never more
than the window leaves after the head, the scene notes and `REPLY_RESERVE`
(1024) tokens for the reply, and never under `HISTORY_FLOOR` (512).

The roleplay mode turns the app's own compaction off, so nothing else stops an
over-full request. An 8k reveal run with a five-person cast peaked at 8,157 of
8,192 tokens before the reply; the same turn now comes to 6,990. With a normal
head at 16k the share is unchanged.
