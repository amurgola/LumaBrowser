# TraceEventLabel

`core/diagnostics/TraceEventLabel.js`

Human labels for DevTools timeline slices.

## Methods

- `TraceEventLabel.describe(event, aggregate = false)`:
  `FunctionCall <fn> <file>:<line>`, `EventDispatch <type>`, `TimerFire #<id>`,
  `Layout (<dirty> dirty / <total> total)`, `EvaluateScript <file>`,
  `XHRLoad|XHRReadyStateChange|ResourceReceiveResponse|ResourceFinish <file>`,
  otherwise the event name. `aggregate` drops timer ids and layout sizes so the
  label can key a self-time total, while keeping function identity.
- `TraceEventLabel.shortUrl(url)` the last path segment, or `''`.
