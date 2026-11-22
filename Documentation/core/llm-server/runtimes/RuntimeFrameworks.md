# RuntimeFrameworks

`core/llm-server/runtimes/RuntimeFrameworks.js`

Groups runtime rows into frameworks and says which model formats each loads.

## Terms

- **Format**: what a model file is: `gguf`, `mlx`, `ninfer`, `basalt`.
- **Framework**: one engine offered as one or more builds: llama.cpp (`llama-cpp`), ik_llama.cpp (`ik-llama`),
  Basalt (`basalt`), NInfer, MLX (`mlx`).
- **Build**: one runtime row (`llama-cpp-cuda13`, `basalt-luma`). The user keeps one build of a framework active.

## Methods

- `RuntimeFrameworks.formatOfModel(model)`: the format of a scanned model: `gguf` for kind `weights`, the kind
  itself otherwise, null for a companion file (`mmproj-only`, `mtp-only`) or no model.
- `formatsOf(row)`: the formats a catalog entry or detected row loads: its `modelKinds` when it has any, `['mlx']`
  for the MLX launch style, else `['gguf']`.
- `loads(row, format)`: whether the row loads that format; false for a null format.
- `frameworkIdOf(row)`: `row.framework`, else the row's own id. `frameworkNameOf(row)`: `row.frameworkName`, else
  the row's name.
- `group(rows)`: `[{ id, name, formats, buildIds }]` in the order each framework first appears. Rows of another
  kind than `inference` are left out.
- Constants: `GGUF`, `MLX`, `INFERENCE_KIND`, `MLX_LAUNCH_STYLE`, `GGUF_MODEL_KIND`, `COMPANION_KINDS`.

## Why

Before this, every row was a flat "runtime" and one global setting picked among all of them, so the nine llama.cpp
builds looked like nine unrelated things and a model the selected runtime could not load was refused. Naming the
framework lets the app keep one active build per engine and let the model's format choose the engine.

A row that names no framework is its own one-build framework, so an extension written before this field existed
keeps working. Formats are derived, not declared, for llama.cpp style rows: adding `modelKinds` to them would turn
on the "this runtime only loads its own kind" rules that `modelKinds` already drives elsewhere.
