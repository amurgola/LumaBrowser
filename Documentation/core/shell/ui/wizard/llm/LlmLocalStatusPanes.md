# LlmLocalStatusPanes

`core/shell/ui/wizard/llm/LlmLocalStatusPanes.js` (ES module)

The local-setup outcome views: progress, "Local AI ready" and the error view.

## Methods

- `progress(pane)` (Cancel stops the LLM download), `done(pane)` ("Linked and
  running." for an adopted model, else "Downloaded and running."),
  `error(pane)`: Try again returns to the scan (Switcher without a
  recommendation), the recommendation or the questions; "Use a hosted API
  instead" switches to remote Anthropic.

## Globals

None.
