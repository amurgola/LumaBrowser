# RunDetailView

`extensions/ext-test-harness/ui/RunDetailView.js`

Markup for an expanded Test Harness run.

## Methods

- `RunDetailView.render(run, detail)`: `''` without a detail; else a
  `.th-run-detail` with the `Copy as MD` button (`.th-copy-md-btn
  [data-run-id]`), assertions (PASS/FAIL badge, detail cut to 100 chars), the
  tool-call timeline (params cut to 80 chars, `ok`/`err`), notes with data as
  a `<pre>`, the final response, the
  conversation log in a `<details>` (`Conversation Log (N messages)`) and the
  error. Every value is escaped.
