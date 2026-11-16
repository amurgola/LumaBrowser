# LoraTrainerTools

`extensions/lora-trainer/LoraTrainerTools.js`

The tools of the chat agent and MCP clients.

## Tools

- `train_lora { name, images?, imageFolder?, imagePaths?, model?, subject?, trigger?, steps?, rank?, applyWhenDone? }`:
  starts a background job through [LoraTrainingFlow](LoraTrainingFlow.md) and returns its
  snapshot at once with a note not to wait.
- `lora_training_status { jobId? }`: [TrainerOverview](TrainerOverview.md).
- `cancel_lora_training { jobId? }`.
- `apply_lora { lora, model?, weight?, remove? }`: [LoraApplier](LoraApplier.md).

`train_lora`, `cancel_lora_training` and `apply_lora` declare `mutating: true`, so the chat's
approval gate asks first. All four are host-only ([HostOnlyTools](../../core/llm-server/chat/router/HostOnlyTools.md)).

## Methods

- `bind(services)`; `handle(toolName, args)` -> an MCP result whose text is
  `{ success: true, ... }` or `{ success: false, error }` (with `isError`). Never throws.
