# ModelFrameHead

`core/llm-server/ui/js/setup-ui/models/ModelFrameHead.js`

The heading line of one model frame ([ModelFrames](ModelFrames.md)), carried in the `groupHtml` of the frame's first row, above that row's family heading.

## Methods

- `ModelFrameHead.html(frame, frameworks)`: `div.model-frame-head[data-model-frame=<frame key>]`. Names come from `frameworks.nameOf` and `frameworks.buildName`; with no store or a store whose `view` is still null they fall back to the ids.
  - `served`: `.model-frame-name` "llama.cpp" and `.model-frame-meta` "11 GGUF models" (what it holds and a plain count; a frame holding two formats says "GGUF and MLX").
  - `missing`: "Basalt: not installed", the count, and one `Install <build name>` button (`data-runtime-action="install"`, `data-runtime-id`), handled by [SetupClickRouter](../SetupClickRouter.md).
  - `unloadable`: one quiet `.model-frame-note`, "No framework on this PC loads these 2 MLX models." (or "this MLX model").
  - `companion`: "Companion files" with "N files, loaded with a model, not on their own".
- `FORMAT_NAMES`: `gguf` GGUF, `mlx` MLX, `ninfer` NInfer, `basalt` Basalt; another format shows its id.

## Why

A frame is a heading, a `--border-soft` hairline and spacing, never a boxed card inside the card (DesignSystem.md); the styles are in `core/llm-server/ui/css/setup-model-frames.css`. Riding on the first row keeps the shared model list ([ModelList](../../models/ModelList.md)) unchanged: its rows already carry a heading slot. The frame attribute is `data-model-frame`, not `data-framework`, which belongs to the Frameworks card's frames.
