# PlanSummary

`core/llm-server/models/auto-plan/PlanSummary.js`

Writes the plain-language lines of the Automatic Local Setup preview.

## Methods

- `PlanSummary.build(plan)` with `{ llm, llmPick, image, wantImage, music, wantMusic, musicSkippedReason, musicPooled, placement, ramPin, machine }`
  returns, in order and skipping empty ones: the chat line; the image line (or "No
  image model is available for this platform."); the placement line (coexist with
  the quoted budget, swap with the pooled members and what they would need
  together, or the fcfs streaming note); the CPU-only, partial-offload or
  cpu-moe note; the image streaming note; the music line or skip reason; the RAM
  pin line.
- `PlanSummary.listPhrase(parts)` "a", "a and b", "a, b and c".
- `PlanSummary.combinedNeed({ image, machine, llmPick })` final pick VRAM need
  plus image need plus 2 GB headroom, or null.

## Why

The coexistence decision is made from byte budgets, so the summary quotes them
against the FINAL pick (the placement may have traded it). Sizes use
`RecommenderRationale.gb`. No em-dashes in any line.
