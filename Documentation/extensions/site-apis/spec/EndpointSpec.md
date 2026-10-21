# EndpointSpec

`extensions/site-apis/spec/EndpointSpec.js`

The endpoint definition contract, validated as one unit on every store write.

## Methods

- `normalize({ name, description, params, steps, returns, policy })`: snake_case name, params through
  `ParamTemplate.normalizeParam` (no duplicates), steps through `StepKinds.validate`, every `{{placeholder}}` must
  name a declared param, then `returns` and `policy` normalized. Throws on the first problem.
- `normalizeReturns(returns, steps)`: `kind` from the definition or inferred from the last producer step (`extract`
  / `table` give rows, `read` gives object or value, `transform first` gives object); rows get `fields` from the
  last extract's child selectors when not given.
- `normalizePolicy(policy)`: `DEFAULT_POLICY` (2 attempts, 1.5 s backoff, LLM fallback on, 15 s per step plus
  45 s of recovery through the description, 120 s total) with each number clamped to `POLICY_LIMITS`.
- `usesLlm(steps)`: whether an `llm_transform` step makes the endpoint non-deterministic.
- `RETURN_KINDS`, `STATUSES` (`draft`, `validated`, `broken`).
