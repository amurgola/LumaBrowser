# RetryPolicy

`extensions/site-apis/runtime/RetryPolicy.js`

Applies an endpoint's `policy` to a run and bounds every browser call.

## Methods

- `new RetryPolicy({ sleep?, now? })` (test seams).
- `execute(policy, { signal, attempt(n, deadline), onRetry(n, fault) })`: up to `policy.attempts` tries, `backoffMs`
  between them, only for faults with `retryable: true` (`Faults.RETRYABLE`: `site_unavailable`, `interstitial`,
  `step_failed`, `timeout`); the whole run, backoff included, ends at `totalTimeoutMs` as `timeout`; an aborted
  signal ends it as `aborted` before or during any attempt. Resolves the attempt's value or throws the final
  `RunFault`.
- `RetryPolicy.bounded(promise, { timeoutMs, signal, timeoutMessage, step })`: races the promise against a timer and
  the signal; the loser keeps running (a browser call cannot be cancelled) but its outcome is dropped.
- `RetryPolicy.throwIfAborted(signal)`, `RetryPolicy.abortedFault()`, `RetryPolicy.sleep(ms)`.

## Decisions

A timed-out or aborted attempt may leave a browser action in flight; the step loop checks the deadline and the
signal before every step, so the abandoned attempt stops at its next step rather than running the whole script.
