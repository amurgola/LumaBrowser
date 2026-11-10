# HelperModelHint

`core/llm-server/ui/js/setup-ui/defaults/HelperModelHint.js`

The "Helper model" row's caption (a `PollingHint`): nothing while off, "Pick
a model file below." or "Model file not found." for a missing file,
"Loading..." (polling every 1.5 s) while the server comes up, "Ready as
helper::<stem> on GPU n." once it serves, or the first line of the error.

## Methods

- `new HelperModelHint(ctx)` reads `api.getHelperModelStatus()`.
- `paint(hint, status)` returns the next poll delay (0 to stop).
