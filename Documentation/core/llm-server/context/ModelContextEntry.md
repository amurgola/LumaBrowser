# ModelContextEntry

`core/llm-server/context/ModelContextEntry.js`

Builds the picker entry for one local model (shape in
[ContextEstimator](../ContextEstimator.md)).

## Methods

- `new ModelContextEntry({ estimator, rungBuilder })`.
- `ModelContextEntry.isChattable(model)` false for `mmproj-only`, `mtp-only` and
  models without `weights[0].path`.
- `build({ model, runtime, diagnostics, fitEntry, displayNameFor })`:
  - reads the GGUF header only when `gguf.parsed`;
  - one strict ladder per `KvCacheModes.OFFERED_MODES` entry over
    `ContextLadder.rungsFor(contextLength)`;
  - `contextOptions` and `recommendedTokens` from [AutoContextPick](AutoContextPick.md);
  - `nameKey` is `ModelName.key(weights[0].path)`;
  - `speed`: the first rung of the highest-precision ladder, `measured` or
    `predicted` by its source, plus `measuredAtDepth`
    `{ tokens, tokensPerSec, prefillMs, kv, predicted }` from the depth-probe row
    with the planner's prediction at the same depth, or null.

## Why

The measured depth figure and the prediction sit side by side because the pair
is the calibration signal for the decode estimate. The mode table travels with
the ladders because the renderer cannot require it and used to hardcode two modes.
