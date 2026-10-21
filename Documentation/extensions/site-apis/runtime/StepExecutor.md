# StepExecutor

`extensions/site-apis/runtime/StepExecutor.js`

Runs one attempt of an endpoint script in the site's tab: one method per `spec/StepKinds.CATALOG` kind.

## Methods

- `new StepExecutor({ browser, tab, tabId, site, values, resolver, loginCheck, llmTransform, log, policy, signal, deadline, sleep })`.
- `runAll(steps)` -> the current result (null when no producer step ran). Throws a `RunFault`.
- `StepExecutor.render(step, values)`: a navigate `url` is rendered with `encode: true`, every other field with
  `encode: false` (`ParamTemplate.render`).

## Per step

- Before: abort check, total deadline check, placeholder rendering, `log.begin`.
- The dispatch is bounded ([RetryPolicy.bounded](RetryPolicy.md)) by `step.timeoutMs` or `policy.stepTimeoutMs`,
  plus `policy.recoveryTimeoutMs` (45000 when absent) when the step may recover through a description
  (`StepKinds.mayTarget`, a description, `allowLlmFallback` not false), so a slow first model load does not fail
  the step at the plain timeout. The recovery time is logged separately as `recoveryMs`.
- When the bound rejects, the step's `stillWanted` flag goes false: a resolution finishing later is not healed
  into the step or the store ([TargetResolver](TargetResolver.md)).
- After a `navigate`, or any action whose reply says `urlChanged` (`NavigationReply`): the core
  `InterstitialWait` (a "please wait / redirecting" page that never moves on is the `interstitial` fault), then
  [LoginCheck](LoginCheck.md) (`needs_login`, stamped with the step index).
- A failure on an `optional: true` step is logged and swallowed when it is `step_failed` or `timeout`; a
  `needs_login`, `interstitial`, `aborted` or `site_unavailable` fault still ends the run.

## Kinds

| kind | browser call |
| --- | --- |
| navigate | `browser.navigate`, `waitForLoad`, optional `waitMs` sleep, `tabManager.waitForSettle`; a load that reports an error is `site_unavailable` |
| click | `browser.click({ selector, text })` through the resolver |
| type | `browser.typeInto({ selector, text, submit, clear })` |
| press_key | `browser.pressKey({ key })` on the page, or `{ selector, key }` through the resolver |
| select | `browser.selectOption({ selector, option })` |
| scroll | `times` x `browser.scroll({ selector })` or `{ direction, amount }` |
| wait | `browser.waitFor({ selector, text, state, timeout })`; text without a target waits on `body` |
| settle | `tabManager.waitForSettle({ quietMs, maxMs })` |
| read, extract, table | [StepReaders](StepReaders.md); the value goes through `StepReaders.merge` |
| transform | [Transforms](Transforms.md) |
| llm_transform | [LlmTransform](LlmTransform.md) |

Targeted kinds go through [TargetResolver](TargetResolver.md) (`via` is `primary`, `recovered` or `direct`);
page actions log `via: 'page'`, transforms `local`, the LLM transform `llm`.
