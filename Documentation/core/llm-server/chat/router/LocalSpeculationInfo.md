# LocalSpeculationInfo

`core/llm-server/chat/router/LocalSpeculationInfo.js`

What the managed local server drafts with, read off the plan it was launched with
([PlanSummary](../../server/launch/PlanSummary.md)). A chat turn hands it to the
renderer beside llama.cpp's timings, so the speed pill's tooltip
([TurnTimings](../../ui/js/chat/turns/TurnTimings.md)) can say which speculative branch
produced the numbers.

## Methods

- `new LocalSpeculationInfo({ llmServerService })`.
- `forRef(ref)`: the description for a local ref (a profile ref answers for its base
  model), null for a remote one or when there is no plan to read.
- `LocalSpeculationInfo.describe(plan)`: `{ kind, label, file?, specType, draftNMax }`
  with kind `drafter` (`plan.drafterPath`, `specDraftNMax`), `mtp` (`plan.mtp`: built
  in or a separate head file), `ngram` (`plan.ngramSpec`) or `none`; null without a plan.

## Globals

None.
