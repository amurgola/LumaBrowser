# TargetResolver

`extensions/site-apis/runtime/TargetResolver.js`

Finds the element a targeted step acts on: the stored selector first, then the description. Interactive kinds
(`click`, `type`, `select`, `press_key`, `scroll`, `wait`) recover through the core `SelectorFallback`
(`core/browser/controller/SelectorFallback.js`: deterministic accessibility match, the resolution cache, then up
to two validated LLM attempts); reader kinds (`read`, `extract`, `table`) through [ReaderResolver](ReaderResolver.md).

## Methods

- `new TargetResolver({ store, browser, service, endpointId, steps, log, allowLlmFallback, logger })`: `service`
  is the `LlmFallbackService` from [FallbackService](FallbackService.md) (null disables LLM recovery), `steps`
  the run's live step list.
- `resolve({ tabId, index, step, action, primary, stillWanted })` -> `{ ok, result, via, error, recoveryMs }`.
  `primary(selector)` runs the browser action and answers the service envelope; the same function is the
  fallback's retry. `via` is `primary`, `recovered` (selector failed, description found one) or `direct` (no
  selector, description only). `recoveryMs` is the time spent after the first primary attempt (0 without
  recovery). `stillWanted()` is asked before a heal is written.

## Healing

A selector recovery found that differs from the stored one is written into `steps[index].selector`, listed
through `log.heal(index, selector)` and saved with `store.updateEndpoint(endpointId, { steps })`, except when:

- `stillWanted()` answers false: the step was abandoned (its bound timed out or the run was aborted) before the
  resolution finished. The executor flips the flag when `bounded()` rejects, so a late answer is logged and dropped.
- the stored selector holds a `{{param}}` (the found selector would bake one call's value in).

A save failure is logged and the run continues with the healed step in memory.

## Decisions

`policy.allowLlmFallback: false` (or no service) passes no description to `SelectorFallback`, so an interactive
step only tries its selector; a reader step still runs the deterministic probe (no model involved) and skips the
LLM pass.
