# TurnMilestones

`core/placement/service/TurnMilestones.js`

Splits one placement-test turn into phases.

## Methods

- `markToolStart(now)` the first image-tool event (the LLM finished deciding); later calls are ignored.
- `markProgress(payload, now)` marks the tool start, and when `payload.step` is
  numeric the first and last diffusion step (and `totalSteps` when positive).
- `timing(startedAt, endedAt)` -> `{ llmDecisionMs, imageLoadMs, diffusionMs,
  tailMs, itPerSec, steps }`; a phase whose milestones never fired is null.
  `itPerSec` = steps advanced / diffusion seconds, null unless both are positive.
  `steps` = `totalSteps`, else the last step number.

## Why

A turn is: dispatch, the LLM emits the tool call (decision), the image server
loads the model (load), diffusion steps, then VAE decode, persist and the LLM's
wrap-up (tail). it/s is comparable to the figures users quote per card.
