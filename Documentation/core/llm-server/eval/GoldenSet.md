# GoldenSet

`core/llm-server/eval/GoldenSet.js`

Loads and validates golden eval tasks from a directory of `*.json` files.

## Methods

- `GoldenSet.loadGoldenTasks(dir = GoldenSet.DEFAULT_DIR)` reads every `.json` file in name
  order (each holds one task or an array), validates each task, rejects duplicate ids across
  files, and returns the tasks. Throws on an unreadable dir, invalid JSON, or a bad task.
- `GoldenSet.validateTask(task, source)` throws a message naming the task (or file) if the
  shape is wrong, otherwise returns the task.
- `GoldenSet.DEFAULT_DIR` is `core/llm-server/eval/golden`, which ships `seed.json`, the
  prompt eval's starter set.

## Task shape

```
{ id, category?, group?, prompt?, turns?: [{ prompt, expect? }], requires?: string[],
  allowedTools?, withImages?, passThreshold?, expect?: {...} }
```

A task needs either a string `prompt` (single turn) or a non-empty `turns` array. `requires`
lists capabilities ("web", "images"); the runner skips a task whose capability is absent
rather than failing it, so an offline host does not read as a broken model. `expect` is
documented in [TurnChecks](TurnChecks.md).

## Why validate at load time

The gambit sweep runs for 30 to 60 minutes. A typo'd task that only surfaced on task 34 would
cost the whole run, so the shape is checked up front.

One loader serves both the prompt eval (`./golden`) and the compatibility gambit (its own suite
dir), so the two cannot drift.
