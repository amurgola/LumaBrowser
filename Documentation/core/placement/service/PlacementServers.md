# PlacementServers

`core/placement/service/PlacementServers.js`

The managed model services the placement canvas lays out, read by layout item
key (`llm`, `imageGenerate`, `imageEdit`, `imageVideo`, `music`, `grounding`).
No method throws; an absent or failing service reads as null.

## Methods

- `new PlacementServers({ llmServerService, imageServerService, musicServerService, groundingServerService })`;
  public fields `llm`, `image`, `music`, `grounding` (null when absent).
- `runtimeServer(item)` the supervisor: `llm.runtimeServer`, `image.runtimeServer`,
  `image.editRuntimeServer`, `image.videoRuntimeServer`, `music.server`,
  `grounding.runtimeServer`; null for an unknown item.
- `status(item)` its `getStatus()`, `pid(item)` the status pid.
- `modelKey(item)` the selected model: LLM `modelPath`; image `modelId`,
  `editModelId`, `videoModelId`; music `modelId`; grounding `getModelPath()`
  when configured. Null when unselected.
- `llmModelLabel()` the LLM file stem without `.gguf`, `.bin` or `.safetensors`.
- `imageDefaults()`, `musicDefaults()` (`{}` when unreadable), `musicEnabled()`.
- `isAvailable()` LLM `runtimeId` and `modelPath`, and image `runtimeId` and `modelId`.
- `applyAutoStop(ms)` `setAutoUnloadMs(ms)` on the LLM, image and music services.

## Why

Legacy repeated `this._safe(() => this.image.editRuntimeServer.getStatus())`
and the item-to-field mapping in five methods; one table keeps the snapshot,
sampler, slot info and recorder in agreement.
