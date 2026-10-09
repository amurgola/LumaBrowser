# CoexistencePicker

`core/llm-server/models/auto-plan/CoexistencePicker.js`

Answers whether a chat model and an image model can both stay loaded, card by
card, and finds the most capable chat pick that leaves the image a whole card.

## Methods

- `coexists(cardBudgets, llmNeed, imgNeed)`: the LLM greedily fills the biggest
  cards; true when it fits and one card still has `imgNeed` left.
- `residentPick(models, cardBudgets, vramTotal, imgNeed)`: the best
  [LlmTierPicker](LlmTierPicker.md)`.fullVram` pick that coexists, or null.
- `moePick(models, cardBudgets, vramTotal, ramBudget, imgNeed)`: the same with
  `moeOffload` (experts in RAM, resident share beside the image).

## Why

An image model cannot be sharded, so the summed leftover (total VRAM minus the
image) is only an upper bound: on an 8 + 12 GB box a 7.5 GB LLM fits the 8 GB
left on paper while no card can hold the 10 GB image beside it. Each candidate is
re-checked per card, stepping the budget down below the failed pick until one
passes; room after the greedy fill only shrinks as the LLM grows, so the first
pass is the best.
