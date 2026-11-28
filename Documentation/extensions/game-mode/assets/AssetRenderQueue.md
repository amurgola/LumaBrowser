# AssetRenderQueue

`extensions/game-mode/assets/AssetRenderQueue.js`

Queues the real render of a prepared asset as a background task of its conversation. The placeholder is already on disk; the render waits in the chat's media lane until the reply has ended, shows in the strip above the composer (with Cancel) and replaces the file when it lands. It never holds the agent's turn, and it never takes a card from the chat model while that is still writing.

## Methods

- `new AssetRenderQueue({ chat, conversationId, session, onSettled?, tasks?, lane? })`: `chat` is `context.chat`, `session()` returns the conversation's game session record, `onSettled()` is told after each render ends (the turn builder passes one that stores the new snapshot through [GameSnapshotStore](../session/GameSnapshotStore.md)`.save`). `tasks` (default `AssetRenderQueue.coreTasks()`, the shared core [BackgroundTasks](../../../core/llm-server/chat/tasks/BackgroundTasks.md)) and `lane` (default the core media lane) are test seams.
- `enqueue(spec, modelRef, emit)` marks the asset `pending` ([AssetJob](AssetJob.md)`.mark`, which emits game:state through the tool's `emit`) and starts a task: `tool: generate_asset`, `title` the asset path, `batchId: game-assets-<conversationId>`, the media lane, `quiet: true` (it shows only in the strip; its result is never handed to the model). Records `session.assetTasks.set(rel, taskId)` and returns the task's view.
- `static reconcile(session, tasks?)`: every asset in `session.assetTasks` whose task has ended (or which the registry no longer knows) leaves the map; one still marked `pending` (cancelled while it waited, so it never rendered) becomes `placeholder`. Returns whether any asset changed. Tasks still queued or running are left alone.
- `cancelAll()` stops every `generate_asset` task of this conversation that has not ended. A queued task ends `canceled` at once without reaching the image model; a running one is aborted at the image router (`chat.abortImage()`, the router runs one render at a time, so the render in flight is this task's).
- `static coreTasks()` the shared core task registry, loaded through [CoreRequire](../CoreRequire.md).

## The render

Inside the task: with no image generation ready ([ImageCapability](ImageCapability.md)`.isReady`) the asset is marked `placeholder` and the task fails with `NOT_READY`. Otherwise, on a machine with one GPU (`ImageCapability.canGenerateInline` false) the render is wrapped in `beginExclusive`/`endExclusive`, which takes the card from the chat model (the lane already waited for the reply to end); with a second GPU there is no exclusive window. The task line reads `rendering on <model>` and then the sampling steps ([InlineAssetGenerator](InlineAssetGenerator.md)'s `onProgress`). A landed image succeeds the task (`<rel> generated (<notes>)`); an empty or failed render fails it (`generation failed, the placeholder stands`) with the placeholder kept and the asset marked `placeholder`. Either way the asset leaves `assetTasks` and `onSettled` is told (a throw from it never fails the render).

## Who calls it

[GameAssetTools](../tools/assets/GameAssetTools.md) builds one per turn and hands it to [GenerateAssetTool](../tools/assets/GenerateAssetTool.md) and [GenerateAssetsTool](../tools/assets/GenerateAssetsTool.md). [GameModeDescriptor](../mode/GameModeDescriptor.md)`.postProcess` calls `cancelAll` when the user stopped the build and `reconcile` after every turn; [GameSnapshotStore](../session/GameSnapshotStore.md)`.current` calls `reconcile` before drawing.

## History

New 2026-11-27. It replaced `PendingAssetDrainer` (renders queued on `session.pendingAssets` and drained in the mode's postProcess on one GPU) and the inline render inside the tool call on two GPUs.
