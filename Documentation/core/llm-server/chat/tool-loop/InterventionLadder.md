# InterventionLadder

`core/llm-server/chat/tool-loop/InterventionLadder.js`

The run's loop pressure and the intervention level it maps to.

## Methods

- `pressure`, `peak`; `level`: `RUNGS[min(pressure, 3)]`, one of `calm`,
  `steer`, `insist`, `conclude`.
- `climb()`: one level up for a new finding; returns the level to answer it at.
- `ease()`: one level down (not below calm) after a call that made progress.

## Why

A first slip deserves a pointer, a repeated one a firm instruction, and a run
that keeps looping should stop and answer. Easing on real progress means a
run that recovered isn't later treated as though it never did.
