# PlanSteps

`core/llm-server/chat/plan/PlanSteps.js`

The steps of a conversation's plan as a model writes them, read into one shape:
`[{ text, status }]` with `status` one of `PlanSteps.PENDING`, `IN_PROGRESS`,
`COMPLETED`, and exactly one step in progress while any is left to do.

## Methods

- `PlanSteps.normalize(raw)`: the steps, an empty list for an empty one, or null when
  `raw` is not a list or none of its entries reads as a step. It accepts:
  - the documented `{ step, status }`;
  - a bare string (a step not started);
  - the wording under `text`, `title`, `content`, `task`, `description` or `name`;
  - the status under `status` or `state`, in the words models use (`done`, `finished`,
    `active`, `in-progress`, `todo`, ...); an unknown or missing one is `pending`;
  - the whole list as a JSON string.
  Entries that are not steps are skipped, text is cut at `TEXT_MAX` (200) and the list
  at `MAX_STEPS` (20).
- `PlanSteps.complete(steps, number)`: the steps with step `number` (from 1) and every
  step before it completed and the next one in progress; null when there is no such
  step. Up to and including, because a model that says step 2 is done means it has got
  that far, whether or not it reported step 1.
- `PlanSteps.progress(steps)`: `{ total, completed, currentIndex, done }`.
  `currentIndex` is the step in progress, -1 when none is. `done` needs at least one
  step and all of them completed.

## One step in progress

The first step marked in progress keeps the mark and later ones wait. With none
marked, the first step still to do is the one being worked on: a model that lists its
steps without states has started on the first.

## Why lenient

A local model writes `"status": "done"` or passes strings often enough that rejecting
those calls would cost a round trip each time for no gain. What is stored is always
the one shape.
