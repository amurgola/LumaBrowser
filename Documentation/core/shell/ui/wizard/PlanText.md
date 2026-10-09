# PlanText

`core/shell/ui/wizard/PlanText.js` (ES module)

Wording for Automatic Setup: plain-English plan summaries, failure fix hints and the download line.

## Methods

- `summaryLines(lines, plain)`: drops quant tags and token counts when plain.
- `failureHint(msg, failedStep)`: disk full, interrupted download, out of
  memory, or (LLM step) runtime install; `''` otherwise.
- `downloadLine(dlBytes, haveBytes, gb)`: total, what is left, or "Already
  downloaded, nothing more to fetch".

## Globals

None.
