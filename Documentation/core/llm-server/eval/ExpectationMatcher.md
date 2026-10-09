# ExpectationMatcher

`core/llm-server/eval/ExpectationMatcher.js`

Matches values, params and tool calls against the JSON matchers used in eval task expectations
and trigger gating.

## Methods

- `ExpectationMatcher.matchValue(matcher, actual)`: a bare primitive means loose equality
  (`3` matches `'3'`); otherwise an object with one of `{ exists }`, `{ regex, flags }`,
  `{ equals }`, `{ contains }`, `{ oneOf: [] }`, `{ gte, lte }`, checked in that order.
  An object with none of these keys never matches.
- `ExpectationMatcher.matchParams(expectedParams, actualParams)`: every listed matcher must
  hold; extra actual params are ignored; no expected params always matches.
- `ExpectationMatcher.callMatches(spec, call)`: `spec` is `{ tool?, params?, success? }`.
  `tool: "*"` (or no tool) matches any tool.
- `ExpectationMatcher.safeRegex(pattern, flags)` builds a RegExp, or one that matches nothing
  if the pattern is invalid, so a bad hand-written pattern cannot crash a sweep.
- `ExpectationMatcher.WILDCARD_TOOL` is `"*"`.

## Why "*" means any tool

A form fill can go through `type` or `fill_form` and both are correct, so some specs assert
that a call succeeded rather than which tool it was. The same wildcard in `forbiddenTools`
means "any tool is forbidden", so `*` reads as "any tool" in both places.
