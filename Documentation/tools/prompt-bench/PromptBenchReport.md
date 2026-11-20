# PromptBenchReport

`tools/prompt-bench/PromptBenchReport.js`

Reduces a bench run to its headline figures, finds the cases that changed against an earlier run, and renders the
Markdown report.

## Methods

- `PromptBenchReport.summary(cases)` returns `{ total, passed, accuracy, seconds, peakContextTokens }`. `accuracy`
  is the mean case score (0..1); `peakContextTokens` is null when no case reported a context.
- `PromptBenchReport.changes(cases, baselineCases)` returns `{ regressed, fixed }`: ids that passed in the baseline
  and fail now, and the reverse. A case only one run has is in neither.
- `PromptBenchReport.markdown(run, baseline?)` returns the report: the run line (model, context, tool-call route,
  model load time), the result line, the comparison line when there is a baseline, one table row per case, and a
  "Failed checks" list.

## The table

`Case | Tools | Result | Score | Time | Context | Read | Requests | Called | Response`

- Result is `pass` or `FAIL`, followed by passes of trials (`FAIL 2/3`) when the run repeated its cases, and by
  `(fixed)` or `(regressed)` when it differs from the baseline.
- Time and Context add `(was ...)` when the baseline's value differs.
- Context is the fullest the context got in tokens; Read is the tokens the server had to evaluate.
- Called lists the tools in call order, or `none`.
- Response is the last turn's answer (or `ERROR: ...`) on one line, cut at 90 characters. The full text is in
  `results.json`.
