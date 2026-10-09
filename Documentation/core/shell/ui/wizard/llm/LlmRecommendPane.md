# LlmRecommendPane

`core/shell/ui/wizard/llm/LlmRecommendPane.js` (ES module)

The local-setup recommendation: model, quant (with its gloss), download size, context, runtime, why, hardware line, warnings, and an optional Hugging Face override.

## Methods

- `new LlmRecommendPane(wizard, step)`, `render(pane)`: asks
  `core.llmServer.recommendModel(answers)` once; a failure becomes the error
  view ("Couldn’t generate a recommendation: ..."). "Download & set up" runs
  `runner.runSetup()`; "Change answers" returns to the questions.

## Globals

Reads `window.ipcBridge.invoke`.
