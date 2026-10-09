# ReadBudget

`extensions/code-mode/tools/project/ReadBudget.js`

Sizes the project tools' reads from the window one read competes for.

## Methods (static)

- `compute(service = ExtensionGlobals.llmServerService())` ->
  `{ truncator, wholeFileMaxBytes, ctxPerSlot }`:
  - per-slot context from `service.getEffectiveContext()` (the running plan)
    first, else `getDefaults().contextSize / maxConcurrent`, floored at 256 tokens;
  - `truncator = ToolOutputTruncator.forSlotBudget(ctxPerSlot)` (a quarter of the slot);
  - `wholeFileMaxBytes = ctxPerSlot * 0.8 * 4`.
  Without a known window (no service, or it throws): a default truncator and a
  32 KB whole-file cap, no `ctxPerSlot`. The resolved numbers are logged once per process.

## Why

The persisted request can be clamped by the launch planner (trained length,
slots forced to 1); sizing whole-file reads (which carry `noCompact`) off a
window that does not exist overflowed the real one.
