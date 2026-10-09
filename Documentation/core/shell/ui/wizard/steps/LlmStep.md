# LlmStep

`core/shell/ui/wizard/steps/LlmStep.js` (ES module)

The LLM step: Local AI, Anthropic and OpenAI-compatible cards, then the remote form or the local setup panes. The Switcher's "Your models" step is the same step.

## Methods

- `enter()`: reads the saved remote provider once (unless a key was typed;
  `managedByCore` entries never pre-fill; a saved key reopens remote mode),
  then repaints unless a local install is busy or past the questions.
- `render()`: hides the cards while a local install is in progress, done or
  failed; dispatches `llm.local.view` to [LlmExistingPane](../llm/LlmExistingPane.md),
  [LlmQuestionsPane](../llm/LlmQuestionsPane.md), [LlmRecommendPane](../llm/LlmRecommendPane.md)
  or [LlmLocalStatusPanes](../llm/LlmLocalStatusPanes.md); remote mode shows
  [LlmRemotePane](../llm/LlmRemotePane.md). Switching remote type resets the
  endpoint and models.
- `pane()` (`#setupLlmPane`); `runner` ([LlmLocalRunner](../llm/LlmLocalRunner.md)).

## Globals

Reads `window.ipcBridge.getProviderConfigs`.
