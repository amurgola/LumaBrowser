# PlacementTestRun

`core/placement/service/PlacementTestRun.js`

The placement test: a fluffy cat via `generate_image`, then a party hat via
`edit_image`, timed while VRAM is sampled.

## Methods

- `new PlacementTestRun({ getChatRouter, getArtifactStore, createSampler, recorder,
  slotInfo, finalState, clock? })`; `createSampler()` returns a started
  [VramPeakSampler](VramPeakSampler.md); `finalState()` -> `{ measured, canApply }`.
- `run(send)` streams through `send(type, payload)`:
  - no router with `chat`: `{ success: false, error: 'Chat router unavailable.' }`;
  - no model (`listModels().defaultRef`, else the first model's `ref`):
    `{ success: false, error: 'No LLM model configured.' }`;
  - else two [PlacementTestTurn](PlacementTestTurn.md)s on one conversation. The
    edit message names the generated artifact when there is one
    (`editMessageFor(imageId)`). Then the sampler stops, the recorder saves the
    footprints (best effort) and it resolves (and emits `done`) with
    `{ success: true, steps, totalMs, conversationId, vram, placement, measured, canApply }`;
  - a throw stops the sampler, emits `error { message }` and resolves
    `{ success: false, error, steps, vram }`.
- Statics: `GENERATE_MESSAGE`, `EDIT_MESSAGE`, `NO_ROUTER_ERROR`, `NO_MODEL_ERROR`, `editMessageFor`.

## Why

A real agentic turn is the only way to measure what each model actually holds
while it works; the saved maxima satisfy the allocation gate and draw the
canvas fit bars from real VRAM.
