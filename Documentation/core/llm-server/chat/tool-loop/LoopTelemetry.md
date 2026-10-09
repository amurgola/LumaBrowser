# LoopTelemetry

`core/llm-server/chat/tool-loop/LoopTelemetry.js`

Per-run tool-loop figures for diagnostics and the UI.

## Methods

- `noteRequest()`, `noteRan(record)` (adds scored novelty),
  `noteFinding(finding, level)`.
- `snapshot({ ladder, searchesSpent, searchAllowance })`:
  `{ requested, ran, held, annotated, searchesSpent, searchAllowance,
  meanNovelty, pressure, peakPressure, level, events }`. `events` is
  `{ step, tool, pattern, level, held }`, capped at `MAX_EVENTS` (20).

## Why

A turn that looped is invisible in the transcript's final answer. The snapshot
rides on the done event (`toolLoop`), so the chat UI, the eval harness and
diagnostics can show how often the guard stepped in and why.
